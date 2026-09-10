import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { SearchIcon, CopyIcon, UploadIcon, Trash2Icon } from "lucide-react"

export function Pattern() {
  return (
    <ButtonGroup orientation="vertical">
      <ButtonGroup orientation="vertical">
        <Button variant="outline" size="icon" aria-label="Search">
          <SearchIcon aria-hidden="true" />
        </Button>
        <Button variant="outline" size="icon" aria-label="Copy">
          <CopyIcon aria-hidden="true" />
        </Button>
        <Button variant="outline" size="icon" aria-label="Share">
          <UploadIcon aria-hidden="true" />
        </Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="outline" size="icon" aria-label="Trash">
          <Trash2Icon aria-hidden="true" />
        </Button>
      </ButtonGroup>
    </ButtonGroup>
  )
}