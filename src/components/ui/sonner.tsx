import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      offset={`calc(5rem + env(safe-area-inset-bottom))`}
      mobileOffset={`calc(5rem + env(safe-area-inset-bottom))`}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:glass-panel group-[.toaster]:text-foreground group-[.toaster]:border-0 group-[.toaster]:shadow-glass group-[.toaster]:rounded-2xl",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-full",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-full",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
