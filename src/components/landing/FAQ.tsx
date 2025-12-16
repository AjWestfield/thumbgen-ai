import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

export function FAQ() {
    const faqs = [
        {
            question: "What is ThumbGen AI?",
            answer: "ThumbGen AI is an advanced image generation platform specifically fine-tuned for YouTube thumbnails. It understands viral compositions, high-contrast text placement, and emotional expressions that drive clicks."
        },
        {
            question: "Why choose ThumbGen over Midjourney?",
            answer: "While Midjourney creates beautiful art, ThumbGen creates marketing assets. We optimize for CTR (Click Through Rate) with specific training on successful YouTube videos, face-swapping capabilities, and text integration."
        },
        {
            question: "Do credits expire?",
            answer: "No, purchased credits never expire. You can use them whenever you need to generate a new thumbnail."
        },
        {
            question: "Can I use my own face?",
            answer: "Yes! Our Pro plan allows you to upload reference photos of yourself. The AI will then consistently generate thumbnails featuring your face with various expressions."
        },
    ];

    return (
        <section className="bg-black py-24">
            <div className="container mx-auto max-w-3xl px-4">
                <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-white md:text-5xl">
                    Frequently Asked Questions
                </h2>

                <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, i) => (
                        <AccordionItem key={i} value={`item-${i}`} className="border-zinc-800">
                            <AccordionTrigger className="text-lg text-zinc-200 hover:text-primary hover:no-underline px-4">
                                {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-zinc-400 px-4 pb-4">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    );
}
