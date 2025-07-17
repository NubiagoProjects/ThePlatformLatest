import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { ProductCard } from '@/components/ui/ProductCard'

expect.extend(toHaveNoViolations)

describe('ProductCard Component', () => {
  const mockProduct = {
    id: '1',
    name: 'Wireless Bluetooth Headphones',
    price: 89.99,
    originalPrice: 129.99,
    rating: 4.5,
    reviewCount: 128,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    brand: 'AudioTech',
    inStock: true,
    tags: ['wireless', 'bluetooth', 'noise-cancelling']
  }

  const defaultProps = {
    product: mockProduct,
    onAddToCart: jest.fn(),
    onAddToWishlist: jest.fn(),
    onQuickView: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders product information correctly', () => {
      render(<ProductCard {...defaultProps} />)
      
      expect(screen.getByText('Wireless Bluetooth Headphones')).toBeInTheDocument()
      expect(screen.getByText('AudioTech')).toBeInTheDocument()
      expect(screen.getByText('$89.99')).toBeInTheDocument()
      expect(screen.getByText('$129.99')).toBeInTheDocument()
      expect(screen.getByText('(128)')).toBeInTheDocument()
      expect(screen.getByText('wireless')).toBeInTheDocument()
      expect(screen.getByText('bluetooth')).toBeInTheDocument()
    })

    it('renders with different variants', () => {
      const { rerender } = render(<ProductCard {...defaultProps} variant="compact" />)
      
      let card = screen.getByRole('article')
      expect(card).toHaveClass('rounded-md')

      rerender(<ProductCard {...defaultProps} variant="featured" />)
      card = screen.getByRole('article')
      expect(card).toHaveClass('rounded-xl', 'shadow-lg')
    })

    it('shows discount badge when original price is higher', () => {
      render(<ProductCard {...defaultProps} />)
      
      expect(screen.getByText('-31%')).toBeInTheDocument()
    })

    it('does not show discount badge when no original price', () => {
      const productWithoutOriginalPrice = {
        ...mockProduct,
        originalPrice: undefined
      }
      
      render(<ProductCard {...defaultProps} product={productWithoutOriginalPrice} />)
      
      expect(screen.queryByText(/-%\d+/)).not.toBeInTheDocument()
    })

    it('shows out of stock overlay when product is not in stock', () => {
      const outOfStockProduct = {
        ...mockProduct,
        inStock: false
      }
      
      render(<ProductCard {...defaultProps} product={outOfStockProduct} />)
      
      expect(screen.getByText('Out of Stock')).toBeInTheDocument()
    })

    it('disables add to cart button when out of stock', () => {
      const outOfStockProduct = {
        ...mockProduct,
        inStock: false
      }
      
      render(<ProductCard {...defaultProps} product={outOfStockProduct} />)
      
      const addToCartButton = screen.getByRole('button', { name: /add to cart/i })
      expect(addToCartButton).toBeDisabled()
      expect(addToCartButton).toHaveTextContent('Out of Stock')
    })
  })

  describe('User Interactions', () => {
    it('calls onAddToCart when add to cart button is clicked', async () => {
      const user = userEvent.setup()
      const onAddToCart = jest.fn()
      
      render(<ProductCard {...defaultProps} onAddToCart={onAddToCart} />)
      
      const addToCartButton = screen.getByRole('button', { name: /add to cart/i })
      await user.click(addToCartButton)
      
      expect(onAddToCart).toHaveBeenCalledWith('1')
    })

    it('calls onAddToWishlist when wishlist button is clicked', async () => {
      const user = userEvent.setup()
      const onAddToWishlist = jest.fn()
      
      render(<ProductCard {...defaultProps} onAddToWishlist={onAddToWishlist} />)
      
      const wishlistButton = screen.getByRole('button', { name: /add.*wishlist/i })
      await user.click(wishlistButton)
      
      expect(onAddToWishlist).toHaveBeenCalledWith('1')
    })

    it('calls onQuickView when quick view button is clicked', async () => {
      const user = userEvent.setup()
      const onQuickView = jest.fn()
      
      render(<ProductCard {...defaultProps} onQuickView={onQuickView} />)
      
      const quickViewButton = screen.getByRole('button', { name: /quick view/i })
      await user.click(quickViewButton)
      
      expect(onQuickView).toHaveBeenCalledWith('1')
    })

    it('navigates to product detail page when product name is clicked', async () => {
      const user = userEvent.setup()
      
      render(<ProductCard {...defaultProps} />)
      
      const productLink = screen.getByRole('link', { name: /view details for wireless bluetooth headphones/i })
      expect(productLink).toHaveAttribute('href', '/product/1')
    })

    it('navigates to product detail page when product image is clicked', async () => {
      const user = userEvent.setup()
      
      render(<ProductCard {...defaultProps} />)
      
      const imageLink = screen.getByRole('link', { name: /view details for wireless bluetooth headphones/i })
      expect(imageLink).toHaveAttribute('href', '/product/1')
    })
  })

  describe('Rating Display', () => {
    it('displays correct number of filled stars', () => {
      render(<ProductCard {...defaultProps} />)
      
      const stars = screen.getAllByRole('img', { hidden: true })
      const filledStars = stars.filter(star => star.classList.contains('text-yellow-400'))
      expect(filledStars).toHaveLength(4) // 4.5 rating should show 4 filled stars
    })

    it('displays review count', () => {
      render(<ProductCard {...defaultProps} />)
      
      expect(screen.getByText('(128)')).toBeInTheDocument()
    })
  })

  describe('Tags Display', () => {
    it('displays product tags', () => {
      render(<ProductCard {...defaultProps} />)
      
      expect(screen.getByText('wireless')).toBeInTheDocument()
      expect(screen.getByText('bluetooth')).toBeInTheDocument()
    })

    it('does not display tags in compact variant', () => {
      render(<ProductCard {...defaultProps} variant="compact" />)
      
      expect(screen.queryByText('wireless')).not.toBeInTheDocument()
      expect(screen.queryByText('bluetooth')).not.toBeInTheDocument()
    })

    it('limits tags to first 2', () => {
      const productWithManyTags = {
        ...mockProduct,
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5']
      }
      
      render(<ProductCard {...defaultProps} product={productWithManyTags} />)
      
      expect(screen.getByText('tag1')).toBeInTheDocument()
      expect(screen.getByText('tag2')).toBeInTheDocument()
      expect(screen.queryByText('tag3')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<ProductCard {...defaultProps} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should not have accessibility violations when out of stock', async () => {
      const outOfStockProduct = {
        ...mockProduct,
        inStock: false
      }
      
      const { container } = render(<ProductCard {...defaultProps} product={outOfStockProduct} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should not have accessibility violations in compact variant', async () => {
      const { container } = render(<ProductCard {...defaultProps} variant="compact" />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should not have accessibility violations in featured variant', async () => {
      const { container } = render(<ProductCard {...defaultProps} variant="featured" />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has proper ARIA labels and descriptions', () => {
      render(<ProductCard {...defaultProps} />)
      
      const article = screen.getByRole('article')
      expect(article).toHaveAttribute('aria-labelledby', 'product-title-1')
      expect(article).toHaveAttribute('aria-describedby', 'product-description-1')
      
      expect(screen.getByText('Wireless Bluetooth Headphones')).toHaveAttribute('id', 'product-title-1')
      expect(screen.getByText(/Wireless Bluetooth Headphones by AudioTech/)).toHaveAttribute('id', 'product-description-1')
    })

    it('has proper rating aria-label', () => {
      render(<ProductCard {...defaultProps} />)
      
      const ratingContainer = screen.getByLabelText('Rating: 4.5 out of 5 stars')
      expect(ratingContainer).toBeInTheDocument()
    })

    it('has proper brand aria-label', () => {
      render(<ProductCard {...defaultProps} />)
      
      const brandElement = screen.getByLabelText('Brand: AudioTech')
      expect(brandElement).toBeInTheDocument()
    })
  })

  describe('Keyboard Navigation', () => {
    it('supports keyboard navigation for add to cart button', async () => {
      const user = userEvent.setup()
      const onAddToCart = jest.fn()
      
      render(<ProductCard {...defaultProps} onAddToCart={onAddToCart} />)
      
      const addToCartButton = screen.getByRole('button', { name: /add to cart/i })
      addToCartButton.focus()
      
      await user.keyboard('{Enter}')
      expect(onAddToCart).toHaveBeenCalledWith('1')
    })

    it('supports keyboard navigation for wishlist button', async () => {
      const user = userEvent.setup()
      const onAddToWishlist = jest.fn()
      
      render(<ProductCard {...defaultProps} onAddToWishlist={onAddToWishlist} />)
      
      const wishlistButton = screen.getByRole('button', { name: /add.*wishlist/i })
      wishlistButton.focus()
      
      await user.keyboard('{Enter}')
      expect(onAddToWishlist).toHaveBeenCalledWith('1')
    })

    it('supports keyboard navigation for quick view button', async () => {
      const user = userEvent.setup()
      const onQuickView = jest.fn()
      
      render(<ProductCard {...defaultProps} onQuickView={onQuickView} />)
      
      const quickViewButton = screen.getByRole('button', { name: /quick view/i })
      quickViewButton.focus()
      
      await user.keyboard('{Enter}')
      expect(onQuickView).toHaveBeenCalledWith('1')
    })
  })

  describe('Screen Reader Support', () => {
    it('provides screen reader description', () => {
      render(<ProductCard {...defaultProps} />)
      
      const description = screen.getByText(/Wireless Bluetooth Headphones by AudioTech/)
      expect(description).toHaveClass('sr-only')
      expect(description).toHaveTextContent(/Price: \$89\.99/)
      expect(description).toHaveTextContent(/Original price: \$129\.99/)
      expect(description).toHaveTextContent(/Save 31%/)
      expect(description).toHaveTextContent(/Rating: 4\.5 out of 5 stars from 128 reviews/)
    })

    it('provides out of stock message for screen readers', () => {
      const outOfStockProduct = {
        ...mockProduct,
        inStock: false
      }
      
      render(<ProductCard {...defaultProps} product={outOfStockProduct} />)
      
      const outOfStockMessage = screen.getByText('This product is currently out of stock')
      expect(outOfStockMessage).toHaveClass('sr-only')
    })
  })
}) 