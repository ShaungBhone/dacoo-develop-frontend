"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Slider } from "@/components/ui/slider"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

const DEFAULT_OUTPUT_SIZE = 512

type Position = {
  x: number
  y: number
}

export function getImageBounds(
  image: Pick<HTMLImageElement, "naturalHeight" | "naturalWidth">,
  zoom: number,
  outputWidth = DEFAULT_OUTPUT_SIZE,
  outputHeight = DEFAULT_OUTPUT_SIZE
) {
  const scale =
    Math.max(
      outputWidth / image.naturalWidth,
      outputHeight / image.naturalHeight
    ) * zoom
  const width = image.naturalWidth * scale
  const height = image.naturalHeight * scale

  return {
    height,
    maxX: Math.max(0, (width - outputWidth) / 2),
    maxY: Math.max(0, (height - outputHeight) / 2),
    width,
  }
}

function clampPosition(
  image: HTMLImageElement,
  zoom: number,
  position: Position,
  outputWidth: number,
  outputHeight: number
): Position {
  const { maxX, maxY } = getImageBounds(image, zoom, outputWidth, outputHeight)

  return {
    x: Math.min(maxX, Math.max(-maxX, position.x)),
    y: Math.min(maxY, Math.max(-maxY, position.y)),
  }
}

export function ImageCropDialog({
  open,
  imageUrl,
  fileName,
  mimeType,
  title = "Crop image",
  previewLabel = "Image crop preview",
  description = "Drag to position. Slide to zoom.",
  outputWidth = DEFAULT_OUTPUT_SIZE,
  outputHeight = DEFAULT_OUTPUT_SIZE,
  cropShape = "circle",
  maxFileSizeBytes,
  onOpenChange,
  onCrop,
}: {
  open: boolean
  imageUrl: string
  fileName: string
  mimeType: string
  title?: string
  previewLabel?: string
  description?: string
  outputWidth?: number
  outputHeight?: number
  cropShape?: "circle" | "rectangle"
  maxFileSizeBytes?: number
  onOpenChange: (open: boolean) => void
  onCrop: (file: File) => Promise<void> | void
}) {
  const zoomId = React.useId()
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const dragRef = React.useRef<{
    pointerId: number
    x: number
    y: number
  } | null>(null)
  const [image, setImage] = React.useState<HTMLImageElement | null>(null)
  const [position, setPosition] = React.useState<Position>({ x: 0, y: 0 })
  const [zoom, setZoom] = React.useState(1)
  const [cropping, setCropping] = React.useState(false)
  const [cropError, setCropError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open || !imageUrl) return

    const nextImage = new Image()
    nextImage.onload = () => {
      setImage(nextImage)
      setPosition({ x: 0, y: 0 })
      setZoom(1)
      setCropError(null)
    }
    nextImage.onerror = () => {
      setImage(null)
      setCropError("The selected image could not be loaded.")
    }
    nextImage.src = imageUrl

    return () => {
      nextImage.onload = null
      nextImage.onerror = null
    }
  }, [imageUrl, open])

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !image) return

    const context = canvas.getContext("2d")
    if (!context) return

    const { width, height } = getImageBounds(
      image,
      zoom,
      outputWidth,
      outputHeight
    )
    context.clearRect(0, 0, outputWidth, outputHeight)
    if (mimeType === "image/jpeg") {
      context.fillStyle = "#ffffff"
      context.fillRect(0, 0, outputWidth, outputHeight)
    }
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = "high"
    context.drawImage(
      image,
      (outputWidth - width) / 2 + position.x,
      (outputHeight - height) / 2 + position.y,
      width,
      height
    )
  }, [image, mimeType, outputHeight, outputWidth, position, zoom])

  function handleZoomChange(value: number | readonly number[]) {
    const nextZoom = typeof value === "number" ? value : (value[0] ?? 1)
    setZoom(nextZoom)
    if (image) {
      setPosition((current) =>
        clampPosition(image, nextZoom, current, outputWidth, outputHeight)
      )
    }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    }
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId || !image) return

    const canvasWidth = event.currentTarget.getBoundingClientRect().width
    if (canvasWidth === 0) return

    const scale = outputWidth / canvasWidth
    const deltaX = (event.clientX - drag.x) * scale
    const deltaY = (event.clientY - drag.y) * scale
    dragRef.current = { ...drag, x: event.clientX, y: event.clientY }
    setPosition((current) =>
      clampPosition(
        image,
        zoom,
        {
          x: current.x + deltaX,
          y: current.y + deltaY,
        },
        outputWidth,
        outputHeight
      )
    )
  }

  function handlePointerEnd(event: React.PointerEvent<HTMLCanvasElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return

    dragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  async function handleCrop() {
    const canvas = canvasRef.current
    if (!canvas || !image) return

    setCropping(true)
    setCropError(null)

    try {
      let quality = 0.92
      let blob: Blob | null = null

      do {
        blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, mimeType, quality)
        })
        quality -= 0.08
      } while (
        blob &&
        maxFileSizeBytes &&
        blob.size > maxFileSizeBytes &&
        mimeType === "image/jpeg" &&
        quality >= 0.44
      )

      if (!blob) {
        throw new Error("Image cropping failed")
      }
      if (maxFileSizeBytes && blob.size > maxFileSizeBytes) {
        throw new Error(
          `The cropped image is larger than ${Math.round(maxFileSizeBytes / 1024)} KB.`
        )
      }

      await onCrop(
        new File([blob], fileName, {
          lastModified: Date.now(),
          type: mimeType,
        })
      )
    } catch (error) {
      setCropError(
        error instanceof Error
          ? error.message
          : "The image could not be cropped. Please try another image."
      )
    } finally {
      setCropping(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!cropping) onOpenChange(nextOpen)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div
          className={cn(
            "mx-auto w-full overflow-hidden bg-background ring-1 ring-border",
            cropShape === "circle"
              ? "max-w-80 rounded-full"
              : "max-w-lg rounded-lg"
          )}
          style={{ aspectRatio: `${outputWidth} / ${outputHeight}` }}
        >
          <canvas
            ref={canvasRef}
            width={outputWidth}
            height={outputHeight}
            role="img"
            aria-label={previewLabel}
            className="size-full cursor-grab touch-none active:cursor-grabbing"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
          />
        </div>

        <Field>
          <div className="flex items-center justify-between gap-4">
            <FieldLabel htmlFor={zoomId}>Zoom</FieldLabel>
            <span className="text-sm text-muted-foreground">
              {Math.round(zoom * 100)}%
            </span>
          </div>
          <Slider
            id={zoomId}
            value={[zoom]}
            min={1}
            max={3}
            step={0.01}
            disabled={!image || cropping}
            aria-label="Image zoom"
            onValueChange={handleZoomChange}
          />
        </Field>

        {cropError ? <FieldError>{cropError}</FieldError> : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={cropping}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!image || cropping}
            onClick={handleCrop}
          >
            {cropping && <Spinner data-icon="inline-start" />}
            Crop &amp; upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
