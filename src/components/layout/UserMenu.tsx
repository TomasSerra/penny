import { Logout01Icon, Settings02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useNavigate } from 'react-router'
import type { ThemePreference } from '@shared/types'
import { signOut } from '@/app/auth'
import { useSession } from '@/app/session'
import { useTheme } from '@/app/theme'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { updateSettings } from '@/data/profile'
import { cn } from '@/lib/utils'

export function useDisplayName() {
  const { user, profile } = useSession()
  return user.displayName || profile?.displayName || user.email?.split('@')[0] || 'Vos'
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function UserMenu({ compact }: { compact?: boolean }) {
  const { user, uid } = useSession()
  const { preference, setPreference } = useTheme()
  const navigate = useNavigate()
  const name = useDisplayName()

  const avatar = (
    <Avatar className="size-9 ring-1 ring-foreground/10">
      {user.photoURL && <AvatarImage src={user.photoURL} alt="" referrerPolicy="no-referrer" />}
      <AvatarFallback className="bg-penny/20 text-xs font-semibold text-penny-ink">{initials(name)}</AvatarFallback>
    </Avatar>
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Menú de usuario"
          className={cn(
            'flex items-center gap-3 rounded-2xl text-left outline-none transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50',
            compact ? 'rounded-full p-0.5' : 'w-full p-2',
          )}
        >
          {avatar}
          {!compact && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{name}</span>
              <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={compact ? 'end' : 'start'} side={compact ? 'bottom' : 'top'} className="w-60 rounded-2xl p-1.5">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate font-medium">{name}</span>
          <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/ajustes')}>
          <HugeiconsIcon icon={Settings02Icon} strokeWidth={1.8} />
          Ajustes
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">Tema</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={preference}
          onValueChange={(value) => {
            setPreference(value as ThemePreference)
            updateSettings(uid, { theme: value as ThemePreference }).catch(() => {})
          }}
        >
          <DropdownMenuRadioItem value="light">Claro</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">Oscuro</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">Automático</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => void signOut()}>
          <HugeiconsIcon icon={Logout01Icon} strokeWidth={1.8} />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
