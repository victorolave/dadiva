import { describe, it } from 'vitest'
import { render } from '@testing-library/react'
import { expectNoAxeViolations } from '@/test/axe'
import { PrivacyPage } from '../PrivacyPage'

/**
 * Sin router ni auth: `PrivacyPage`/`LegalLayout` no usan `Link` ni
 * `useAuth`, solo `usePageMeta` (que toca el DOM directamente, sin
 * contexto), así que no hace falta envolverla en nada.
 */
describe('PrivacyPage', () => {
  it('no tiene violaciones de accesibilidad', async () => {
    const { container } = render(<PrivacyPage />)

    await expectNoAxeViolations(container)
  })
})
