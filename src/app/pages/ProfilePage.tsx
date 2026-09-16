import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@modules/auth/presentation/AuthProvider'
import { Alert, Avatar, Button, Sticker, TextField } from '@ui/atoms'
import { cn } from '@ui/utils/cn'
import { isSafeReturnPath } from '../routes/returnTo'

const EMOJI_OPTIONS = ['🎁', '🌷', '✨', '🕊️', '🌻', '💛', '🍀', '🌈', '☕', '📖', '🧁', '🫶'] as const

export const ProfilePage = () => {
  const { user, completeProfile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [avatarEmoji, setAvatarEmoji] = useState(user?.avatarEmoji ?? '🎁')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const from = (location.state as { from?: unknown } | null)?.from
  const returnTo = isSafeReturnPath(from) ? from : '/grupos'

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsSaving(true)

    const result = await completeProfile({ displayName, avatarEmoji })
    setIsSaving(false)

    if ('message' in result && 'kind' in result) {
      setError(result.message)
      return
    }

    navigate(returnTo === '/perfil' ? '/grupos' : returnTo, { replace: true })
  }

  return (
    <div className="mx-auto flex max-w-narrow flex-col gap-6">
      <div className="text-center">
        <p className="eyebrow">Perfil</p>
        <h1 className="mt-2 text-h1">¿Cómo te llamamos?</h1>
      </div>

      {/* Vista previa en vivo: refleja nombre y emoji mientras se escriben,
          igual que se verán en la lista de miembros de un grupo. */}
      <Sticker tone="blush" className="flex items-center gap-4 p-4">
        <Avatar emoji={avatarEmoji} size="xl" tint="paper" />
        <div className="min-w-0">
          <p className="truncate font-display text-h3">{displayName.trim() || 'Tu nombre'}</p>
          <p className="text-sm text-ink-soft">Así te verán en tus grupos.</p>
        </div>
      </Sticker>

      <Sticker className="p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
          <TextField
            label="Tu nombre"
            name="displayName"
            autoComplete="given-name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="María José"
            required
          />

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-bold">Elige tu emoji</legend>
            <div className="grid grid-cols-6 gap-2">
              {EMOJI_OPTIONS.map((emoji) => {
                const isSelected = emoji === avatarEmoji
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setAvatarEmoji(emoji)}
                    aria-pressed={isSelected}
                    aria-label={`Emoji ${emoji}`}
                    className={cn(
                      'grid size-11 place-items-center rounded-control border-2 border-ink text-xl',
                      'transition-[background-color,box-shadow] duration-120 ease-standard',
                      isSelected ? 'bg-blush-300 shadow-sticker-sm' : 'bg-paper hover:bg-paper-deep',
                    )}
                  >
                    <span aria-hidden="true">{emoji}</span>
                  </button>
                )
              })}
            </div>
          </fieldset>

          {error && <Alert tone="error">{error}</Alert>}

          <Button type="submit" size="lg" fullWidth isLoading={isSaving}>
            Guardar y continuar
          </Button>
        </form>
      </Sticker>
    </div>
  )
}
