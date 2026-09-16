import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { asPromiseCardId } from '@core/domain/Entity'
import { PromiseCard } from '../../../domain/entities/PromiseCard'
import { PromiseDeck } from '../PromiseDeck'

const buildCard = () =>
  PromiseCard.create({
    id: asPromiseCardId('santiago-1-17'),
    reference: 'Santiago 1:17',
    text: 'Toda buena dádiva y todo don perfecto desciende de lo alto.',
    version: 'RVR1960',
    themeKey: 'arcoiris',
    drawnAt: new Date('2026-09-15'),
  })

describe('PromiseDeck · promesa ya guardada', () => {
  it('muestra la carta directamente, sin ritual de elección', () => {
    render(<PromiseDeck savedCard={buildCard()} onDraw={vi.fn()} />)

    expect(screen.getByText(/Toda buena dádiva/)).toBeInTheDocument()
    expect(screen.getByText('Santiago 1:17')).toBeInTheDocument()
    // Si ya tiene promesa, no debe ofrecerle sacar otra.
    expect(screen.queryByRole('button', { name: /abrir el mazo/i })).not.toBeInTheDocument()
  })

  it('resalta las palabras indicadas dentro del versículo', () => {
    render(<PromiseDeck savedCard={buildCard()} highlight={['dádiva']} onDraw={vi.fn()} />)

    const marks = screen.getAllByText('dádiva')
    expect(marks.length).toBeGreaterThan(0)
    expect(marks[0]?.tagName).toBe('MARK')
  })
})

describe('PromiseDeck · contrato de accesibilidad', () => {
  it('expone las cartas con nombre accesible y una sola parada de tabulación', async () => {
    render(<PromiseDeck savedCard={null} onDraw={vi.fn()} />)

    const cards = screen.getAllByRole('button', { name: /^Carta \d+ de \d+$/ })
    expect(cards.length).toBe(9)

    // Con el mazo cerrado ninguna carta es alcanzable: la acción es abrirlo.
    expect(cards.every((card) => card.getAttribute('tabindex') === '-1')).toBe(true)
    expect(screen.getByRole('button', { name: /abrir el mazo/i })).toBeInTheDocument()
  })

  it('deja exactamente una carta enfocable tras abrir el mazo', async () => {
    const user = userEvent.setup()
    render(<PromiseDeck savedCard={null} onDraw={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /abrir el mazo/i }))

    const cards = screen.getAllByRole('button', { name: /^Carta \d+ de \d+$/ })
    const focusable = cards.filter((card) => card.getAttribute('tabindex') === '0')

    // Nueve paradas de tabulación seguidas serían una tortura con teclado:
    // se entra una vez y se navega con flechas.
    expect(focusable).toHaveLength(1)
  })

  it('pide la carta al servidor al elegir, no la decide el cliente', async () => {
    const user = userEvent.setup()
    const onDraw = vi.fn().mockResolvedValue(buildCard())

    render(<PromiseDeck savedCard={null} onDraw={onDraw} />)
    await user.click(screen.getByRole('button', { name: /abrir el mazo/i }))

    const cards = screen.getAllByRole('button', { name: /^Carta \d+ de \d+$/ })
    const target = cards[3]
    expect(target).toBeDefined()

    await user.click(target as HTMLElement)

    expect(onDraw).toHaveBeenCalledTimes(1)
  })
})
