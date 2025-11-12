interface MathFieldElement extends HTMLElement {
    value: string;
    addEventListener(
        type: "input",
        listener: (event: Event & { target: MathFieldElement }) => void
    ): void;
    executeCommand?: (command: string) => void;
}

declare namespace JSX {
    interface IntrinsicElements {
        "math-field": React.DetailedHTMLProps<
            React.HTMLAttributes<MathFieldElement>,
            MathFieldElement
        > & {
            "virtual-keyboard-mode"?: "auto" | "onfocus" | "manual" | "off";
            "virtual-keyboard-theme"?: string;
            "read-only"?: boolean | string;
        };
    }
}

