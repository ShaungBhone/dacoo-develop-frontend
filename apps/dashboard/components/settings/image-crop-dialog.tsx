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
import { Field, FieldLabel } from "@/components/ui/field"
import { Slider } from "@/components/ui/slider"
import { Spinner } from "@/components/ui/spinner"

const OUTPUT_SIZE = 512

type Position = {
  x: number
  y: number
}

function getImageBounds(image: HTMLImageElement, zoom: number) {
  const scale =
    Math.max(
      OUTPUT_SIZE / image.naturalWidth,
      OUTPUT_SIZE / image.naturalHeight
    ) * zoom
  const width = image.naturalWidth * scale
  const height = image.naturalHeight * scale

  return {
    height,
    maxX: Math.max(0, (width - OUTPUT_SIZE) / 2),
    maxY: Math.max(0, (height - OUTPUT_SIZE) / 2),
    width,
  }
}

function clampPosition(
  image: HTMLImageElement,
  zoom: number,
  position: Position
): Position {
  const { maxX, maxY } = getImageBounds(image, zoom)

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
  onOpenChange,
  onCrop,
}: {
  open: boolean
  imageUrl: string
  fileName: string
  mimeType: string
  title?: string
  previewLabel?: string
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

    const { width, height } = getImageBounds(image, zoom)
    context.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE)
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = "high"
    context.drawImage(
      image,
      (OUTPUT_SIZE - width) / 2 + position.x,
      (OUTPUT_SIZE - height) / 2 + position.y,
      width,
      height
    )
  }, [image, position, zoom])

  function handleZoomChange([nextZoom]: number[]) {
    setZoom(nextZoom)
    if (image) {
      setPosition((current) => clampPosition(image, nextZoom, current))
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

    const scale = OUTPUT_SIZE / canvasWidth
    const deltaX = (event.clientX - drag.x) * scale
    const deltaY = (event.clientY - drag.y) * scale
    dragRef.current = { ...drag, x: event.clientX, y: event.clientY }
    setPosition((current) =>
      clampPosition(image, zoom, {
        x: current.x + deltaX,
        y: current.y + deltaY,
      })
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
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, mimeType, 0.92)
      })
      if (!blob) {
        throw new Error("Image cropping failed")
      }

      await onCrop(
        new File([blob], fileName, {
          lastModified: Date.now(),
          type: mimeType,
        })
      )
    } catch {
      setCropError("The image could not be cropped. Please try another image.")
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
          <DialogDescription>
            Drag to position. Slide to zoom.
          </DialogDescription>
        </DialogHeader>

        <div className="mx-auto aspect-square w-full max-w-80 overflow-hidden rounded-full bg-white ring-1 ring-border dark:bg-white">
          <canvas
            ref={canvasRef}
            width={OUTPUT_SIZE}
            height={OUTPUT_SIZE}
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

        {cropError && (
          <p className="text-sm text-destructive" role="alert">
            {cropError}
          </p>
        )}

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
