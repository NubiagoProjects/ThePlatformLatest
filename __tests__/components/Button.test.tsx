import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { Button, IconButton, ToggleButton, LoadingButton } from '@/components/ui/Button'
import { Heart, ShoppingCart } from 'lucide-react'

expect.extend(toHaveNoViolations)

describe('Button Component', () => {
  const defaultProps = {
    children: 'Test Button',
    onClick: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Button', () => {
    it('renders with default props', () => {
      render(<Button {...defaultProps} />)
      
      const button = screen.getByRole('button', { name: 'Test Button' })
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('bg-red-600', 'text-white')
    })

    it('renders with different variants', () => {
      const { rerender } = render(<Button {...defaultProps} variant="secondary" />)
      
      let button = screen.getByRole('button')
      expect(button).toHaveClass('bg-gray-600')

      rerender(<Button {...defaultProps} variant="outline" />)
      button = screen.getByRole('button')
      expect(button).toHaveClass('border', 'border-gray-300', 'bg-white')

      rerender(<Button {...defaultProps} variant="ghost" />)
      button = screen.getByRole('button')
      expect(button).toHaveClass('text-gray-700', 'hover:bg-gray-100')
    })

    it('renders with different sizes', () => {
      const { rerender } = render(<Button {...defaultProps} size="sm" />)
      
      let button = screen.getByRole('button')
      expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm')

      rerender(<Button {...defaultProps} size="lg" />)
      button = screen.getByRole('button')
      expect(button).toHaveClass('px-6', 'py-3', 'text-base')

      rerender(<Button {...defaultProps} size="xl" />)
      button = screen.getByRole('button')
      expect(button).toHaveClass('px-8', 'py-4', 'text-lg')
    })

    it('handles click events', async () => {
      const user = userEvent.setup()
      const onClick = jest.fn()
      
      render(<Button {...defaultProps} onClick={onClick} />)
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('handles keyboard events', async () => {
      const user = userEvent.setup()
      const onClick = jest.fn()
      
      render(<Button {...defaultProps} onClick={onClick} />)
      
      const button = screen.getByRole('button')
      button.focus()
      
      await user.keyboard('{Enter}')
      expect(onClick).toHaveBeenCalledTimes(1)
      
      await user.keyboard(' ')
      expect(onClick).toHaveBeenCalledTimes(2)
    })

    it('shows loading state', () => {
      render(<Button {...defaultProps} loading={true} />)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('aria-busy', 'true')
      expect(screen.getByText('Test Button')).toHaveClass('sr-only')
    })

    it('is disabled when loading or disabled prop is true', () => {
      const { rerender } = render(<Button {...defaultProps} disabled={true} />)
      
      let button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('aria-disabled', 'true')

      rerender(<Button {...defaultProps} loading={true} />)
      button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('aria-disabled', 'true')
    })

    it('renders with icon on left', () => {
      render(
        <Button {...defaultProps} icon={<Heart data-testid="heart-icon" />} iconPosition="left" />
      )
      
      expect(screen.getByTestId('heart-icon')).toBeInTheDocument()
      expect(screen.getByTestId('heart-icon')).toHaveClass('flex-shrink-0')
    })

    it('renders with icon on right', () => {
      render(
        <Button {...defaultProps} icon={<ShoppingCart data-testid="cart-icon" />} iconPosition="right" />
      )
      
      expect(screen.getByTestId('cart-icon')).toBeInTheDocument()
      expect(screen.getByTestId('cart-icon')).toHaveClass('flex-shrink-0')
    })

    it('renders full width when specified', () => {
      render(<Button {...defaultProps} fullWidth={true} />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('w-full')
    })

    it('has proper focus styles', async () => {
      const user = userEvent.setup()
      
      render(<Button {...defaultProps} />)
      
      const button = screen.getByRole('button')
      await user.tab()
      
      expect(button).toHaveFocus()
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-red-500')
    })
  })

  describe('IconButton Component', () => {
    it('renders with icon and aria-label', () => {
      render(
        <IconButton
          icon={<Heart data-testid="heart-icon" />}
          aria-label="Add to wishlist"
        />
      )
      
      const button = screen.getByRole('button', { name: 'Add to wishlist' })
      expect(button).toBeInTheDocument()
      expect(screen.getByTestId('heart-icon')).toBeInTheDocument()
    })

    it('renders with different sizes', () => {
      const { rerender } = render(
        <IconButton
          icon={<Heart data-testid="heart-icon" />}
          aria-label="Test"
          size="sm"
        />
      )
      
      let button = screen.getByRole('button')
      expect(button).toHaveClass('p-1.5', 'min-w-[32px]', 'min-h-[32px]')

      rerender(
        <IconButton
          icon={<Heart data-testid="heart-icon" />}
          aria-label="Test"
          size="lg"
        />
      )
      button = screen.getByRole('button')
      expect(button).toHaveClass('p-3', 'min-w-[48px]', 'min-h-[48px]')
    })
  })

  describe('ToggleButton Component', () => {
    it('renders with correct pressed state', () => {
      render(
        <ToggleButton
          pressed={true}
          onToggle={jest.fn()}
          aria-label="Toggle button"
        >
          Toggle
        </ToggleButton>
      )
      
      const button = screen.getByRole('button', { name: 'Toggle button' })
      expect(button).toHaveAttribute('aria-pressed', 'true')
      expect(button).toHaveClass('bg-red-600', 'text-white')
    })

    it('calls onToggle when clicked', async () => {
      const user = userEvent.setup()
      const onToggle = jest.fn()
      
      render(
        <ToggleButton
          pressed={false}
          onToggle={onToggle}
          aria-label="Toggle button"
        >
          Toggle
        </ToggleButton>
      )
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      expect(onToggle).toHaveBeenCalledWith(true)
    })

    it('handles keyboard events', async () => {
      const user = userEvent.setup()
      const onToggle = jest.fn()
      
      render(
        <ToggleButton
          pressed={false}
          onToggle={onToggle}
          aria-label="Toggle button"
        >
          Toggle
        </ToggleButton>
      )
      
      const button = screen.getByRole('button')
      button.focus()
      
      await user.keyboard('{Enter}')
      expect(onToggle).toHaveBeenCalledWith(true)
      
      await user.keyboard(' ')
      expect(onToggle).toHaveBeenCalledWith(true)
    })
  })

  describe('LoadingButton Component', () => {
    it('renders loading text when loading', () => {
      render(
        <LoadingButton
          loading={true}
          loadingText="Loading..."
          onClick={jest.fn()}
        >
          Submit
        </LoadingButton>
      )
      
      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.queryByText('Submit')).not.toBeInTheDocument()
    })

    it('renders children when not loading', () => {
      render(
        <LoadingButton
          loading={false}
          loadingText="Loading..."
          onClick={jest.fn()}
        >
          Submit
        </LoadingButton>
      )
      
      expect(screen.getByText('Submit')).toBeInTheDocument()
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<Button {...defaultProps} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should not have accessibility violations when loading', async () => {
      const { container } = render(<Button {...defaultProps} loading={true} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should not have accessibility violations when disabled', async () => {
      const { container } = render(<Button {...defaultProps} disabled={true} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should not have accessibility violations for icon button', async () => {
      const { container } = render(
        <IconButton
          icon={<Heart />}
          aria-label="Add to wishlist"
        />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should not have accessibility violations for toggle button', async () => {
      const { container } = render(
        <ToggleButton
          pressed={false}
          onToggle={jest.fn()}
          aria-label="Toggle button"
        >
          Toggle
        </ToggleButton>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
}) 