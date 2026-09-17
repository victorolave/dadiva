import { describe, it } from 'vitest'
import { render } from '@testing-library/react'
import { expectNoAxeViolations } from '@/test/axe'
import { TermsPage } from '../TermsPage'

/** Ver el comentario de `PrivacyPage.test.tsx`: mismas razones para no envolverla en nada. */
describe('TermsPage', () => {
  it('no tiene violaciones de accesibilidad', async () => {
    const { container } = render(<TermsPage />)

    await expectNoAxeViolations(container)
  })
})
