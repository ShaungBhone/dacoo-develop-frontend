import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronRight, MessageCircle, Send } from 'lucide-react'

const prompts = [
    'Reply to an order-status question',
    'Route an appointment request to the clinic',
    'Qualify a new Messenger sales lead',
    'Send an overdue payment reminder',
    'Answer an account access question',
    'Escalate a complex support issue',
]

const loopingPrompts = Array.from({ length: 4 }, () => prompts).flat()

export default function HeroSection() {
    return (
        <main className="overflow-hidden">
            <section className="bg-background">
                <div className="relative py-40">
                    <div className="relative z-10 mx-auto w-full max-w-5xl sm:pl-6">
                        <div className="flex items-center justify-between max-md:flex-col">
                            <div className="max-w-md max-sm:px-6">
                                <h1 className="text-balance font-serif text-4xl font-medium sm:text-5xl">One Platform for Every Customer</h1>
                                <p className="text-muted-foreground mt-4 text-balance">Manage every conversation — Messenger, Viber, TikTok, Email, Telegram, and more — from one unified dashboard.</p>

                                <div className="mt-6 flex flex-wrap gap-3">
                                    <Button className="pr-1.5" render={<Link href="/contact" />} nativeButton={false}><span className="text-nowrap">Talk to our team</span><ChevronRight className="opacity-50" /></Button>
                                    {/* <Button variant="outline" render={<Link href="/pricing" />} nativeButton={false}>View pricing</Button> */}
                                </div>
                            </div>
                            <div className="relative h-80 w-[30rem] max-w-[calc(100vw-3rem)] overflow-hidden max-md:mx-auto max-md:scale-90 sm:h-96">
                                <div aria-hidden className="hero-prompt-viewport h-full overflow-hidden">
                                    <div className="hero-prompt-marquee">
                                        {loopingPrompts.map((prompt, index) => (
                                            <div
                                                key={`${prompt}-${index}`}
                                                className="text-muted-foreground flex h-9 items-center gap-2 px-6 text-sm sm:px-14">
                                                <MessageCircle className="size-3.5 shrink-0 opacity-50" />
                                                <span className="whitespace-nowrap">{prompt}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-card ring-border shadow-foreground/6.5 dark:shadow-black/6.5 absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-between gap-3 rounded-full p-2 shadow-xl ring-1 sm:inset-x-2">
                                    <span className="pl-3 text-sm text-muted-foreground">Ask Dacoo anything...</span>
                                    <button
                                        type="button"
                                        aria-label="Send message demo"
                                        disabled
                                        className="bg-foreground text-background flex size-9 shrink-0 items-center justify-center rounded-full">
                                        <Send aria-hidden className="size-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}
