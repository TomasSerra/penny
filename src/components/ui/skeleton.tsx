import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-xl border-2 border-ink/25 bg-ink/8", className)}
      {...props}
    />
  )
}

export { Skeleton }
