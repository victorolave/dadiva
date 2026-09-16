import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@modules/auth/presentation/AuthProvider'
import { Alert, Button, Sticker, TextField } from '@ui/atoms'
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
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <div className="text-center">
        <h1 className="text-display-lg">¿Cómo te llamamos?</h1>
        <p className="mt-2 text-ink-soft">Este es el nombre que verán en tus grupos.</p>
      </div>

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
            <legend className="label-mono text-ink-soft">Elige tu emoji</legend>
            <div className="flex flex-wrap gap-2">
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
                      'grid size-11 place-items-center rounded-sticker border-2 text-xl transition-all',
                      isSelected
                        ? 'border-ink bg-blush-300 shadow-sticker'
                        : 'border-ink/25 bg-paper hover:border-ink',
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
