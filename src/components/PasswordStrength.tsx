import { scorePassword, strengthLabel } from "@/lib/passwordStrength";

interface Props {
  password: string;
}

const PasswordStrength = ({ password }: Props) => {
  if (!password) return null;
  const score = scorePassword(password);
  const colors = [
    "bg-destructive/70",
    "bg-amber-500/70",
    "bg-amber-400/70",
    "bg-emerald-500/70",
  ];
  return (
    <div className="flex items-center gap-2 pt-1.5" aria-live="polite">
      <div className="flex gap-1 flex-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < score ? colors[score] : "bg-border"
            }`}
          />
        ))}
      </div>
      <span className="font-body text-[11px] text-muted-foreground min-w-[60px] text-right">
        {strengthLabel(score)}
      </span>
    </div>
  );
};

export default PasswordStrength;
