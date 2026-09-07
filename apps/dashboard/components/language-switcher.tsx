"use client"

import { Globe, Type } from "@/components/ui/icons"
import { CurrencyFlag } from "@/components/currency-flag"
import {
  useBurmeseFont,
  type BurmeseFont,
} from "@/contexts/burmese-font-context"
import { useTranslation, type Locale } from "@/contexts/language-context"
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"

export function ProfileLanguageMenu({ label }: { label: string }) {
  const { locale, setLocale } = useTranslation()

  const languages: { code: Locale; name: string; currencyCode: string }[] = [
    { code: "en", name: "English", currencyCode: "USD" },
    { code: "my", name: "မြန်မာ", currencyCode: "MMK" },
  ]

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Globe />
        {label}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuRadioGroup
          value={locale}
          onValueChange={(nextLocale) => setLocale(nextLocale as Locale)}
        >
          {languages.map((language) => (
            <DropdownMenuRadioItem key={language.code} value={language.code}>
              <CurrencyFlag
                currencyCode={language.currencyCode}
                ariaLabel={`${language.name} flag`}
                className="size-4"
              />
              {language.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}

export function ProfileBurmeseFontMenu() {
  const { burmeseFont, setBurmeseFont } = useBurmeseFont()
  const { locale } = useTranslation()
  const fonts: { value: BurmeseFont; label: string }[] = [
    { value: "typewriter", label: "Z02 Typewriter" },
    { value: "atest", label: "A Test Light" },
  ]

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Type />
        {locale === "my" ? "မြန်မာ ဖောင့်" : "Burmese font"}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuRadioGroup
          value={burmeseFont}
          onValueChange={(font) => setBurmeseFont(font as BurmeseFont)}
        >
          {fonts.map((font) => (
            <DropdownMenuRadioItem key={font.value} value={font.value}>
              {font.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
