import React from 'react'
import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import HomePage from '@/app/page'

expect.extend(toHaveNoViolations)

// Mock the components to avoid complex dependencies
jest.mock('@/components/Header', () => {
  return function MockHeader() {
    return <header data-testid="header">Header</header>
  }
})

jest.mock('@/components/Footer', () => {
  return function MockFooter() {
    return <footer data-testid="footer">Footer</footer>
  }
})

jest.mock('@/components/HeroSection', () => {
  return function MockHeroSection() {
    return <section data-testid="hero-section">Hero Section</section>
  }
})

jest.mock('@/components/FeaturedCategories', () => {
  return function MockFeaturedCategories() {
    return <section data-testid="featured-categories">Featured Categories</section>
  }
})

jest.mock('@/components/ProductCarousel', () => {
  return function MockProductCarousel() {
    return <section data-testid="product-carousel">Product Carousel</section>
  }
})

jest.mock('@/components/HowItWorks', () => {
  return function MockHowItWorks() {
    return <section data-testid="how-it-works">How It Works</section>
  }
})

jest.mock('@/components/Testimonials', () => {
  return function MockTestimonials() {
    return <section data-testid="testimonials">Testimonials</section>
  }
})

jest.mock('@/components/Newsletter', () => {
  return function MockNewsletter() {
    return <section data-testid="newsletter">Newsletter</section>
  }
})

describe('HomePage', () => {
  it('renders all main sections', () => {
    render(<HomePage />)
    
    expect(screen.getByTestId('header')).toBeInTheDocument()
    expect(screen.getByTestId('hero-section')).toBeInTheDocument()
    expect(screen.getByTestId('featured-categories')).toBeInTheDocument()
    expect(screen.getByTestId('product-carousel')).toBeInTheDocument()
    expect(screen.getByTestId('how-it-works')).toBeInTheDocument()
    expect(screen.getByTestId('testimonials')).toBeInTheDocument()
    expect(screen.getByTestId('newsletter')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })

  it('renders with proper semantic structure', () => {
    render(<HomePage />)
    
    // Check for main landmark
    expect(screen.getByRole('main')).toBeInTheDocument()
    
    // Check for header landmark
    expect(screen.getByRole('banner')).toBeInTheDocument()
    
    // Check for footer landmark
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('has proper page title and description', () => {
    render(<HomePage />)
    
    // Check for main heading
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('should not have accessibility violations', async () => {
    const { container } = render(<HomePage />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('renders with proper layout structure', () => {
    render(<HomePage />)
    
    const main = screen.getByRole('main')
    expect(main).toHaveClass('flex-grow')
  })

  it('includes all required sections in correct order', () => {
    render(<HomePage />)
    
    const sections = [
      'hero-section',
      'featured-categories', 
      'product-carousel',
      'how-it-works',
      'testimonials',
      'newsletter'
    ]
    
    sections.forEach(sectionId => {
      expect(screen.getByTestId(sectionId)).toBeInTheDocument()
    })
  })
}) 