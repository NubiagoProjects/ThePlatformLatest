'use client'

import React from 'react'
import { useLocalState, useFormState, useToggle, useCounter } from '@/hooks/useLocalState'
import { useSearchParamsData, useLayoutData } from '@/hooks/useDataProps'
import { useAppStore, useAppActions } from '@/stores/useAppStore'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

/**
 * Example component demonstrating all state management patterns
 * This component showcases the implementation of Phase 5 objectives
 */
export const StateManagementExample: React.FC = () => {
  // 1. Local UI State Examples
  const { state: localText, setState: setLocalText, error: localError } = useLocalState(
    '',
    (value) => value.length > 0 ? true : 'Text is required'
  )

  const form = useFormState(
    { name: '', email: '', age: 0 },
    (values) => {
      const errors: any = {}
      if (!values.name) errors.name = 'Name is required'
      if (!values.email) errors.email = 'Email is required'
      if (values.age < 18) errors.age = 'Must be 18 or older'
      return errors
    }
  )

  const { state: isVisible, toggle: toggleVisibility } = useToggle(false)
  const { count, increment, decrement, reset: resetCounter } = useCounter(0, 0, 10)

  // 2. Data Props Examples
  const { data: searchData, updateData: updateSearch } = useSearchParamsData({
    category: '',
    price: 0,
    sort: 'name'
  })

  const { data: layoutData, setData: setLayoutData } = useLayoutData({
    sidebarCollapsed: false,
    lastVisited: new Date().toISOString()
  })

  // 3. Global State Examples (Zustand)
  const { sidebarOpen, modalOpen } = useAppStore()
  const { toggleSidebar, openModal, closeModal } = useAppActions()

  // 4. Context Examples
  const { user, isAuthenticated, login, logout } = useAuth()
  const { items, addToCart, removeFromCart, getCartCount } = useCart()
  const { theme, setTheme } = useTheme()

  // 5. Toast Examples
  const toast = useToast()

  // Example functions
  const handleLogin = async () => {
    try {
      await login('user@nubiago.com', 'user123')
      toast.success('Login successful!', 'Welcome back!')
    } catch (error) {
      toast.error('Login failed', 'Please check your credentials')
    }
  }

  const handleAddToCart = () => {
    addToCart({
      productId: 'example-1',
      name: 'Example Product',
      price: 29.99,
      image: '/example.jpg',
      quantity: 1,
      inStock: true
    })
    toast.success('Added to cart!', 'Product has been added to your cart')
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (form.isValid) {
      toast.success('Form submitted!', `Hello ${form.values.name}!`)
      form.reset()
    } else {
      toast.error('Form validation failed', 'Please fix the errors above')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-6">State Management Examples</h1>

      {/* Local State Examples */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">1. Local UI State</h2>
        
        <div className="space-y-4">
          {/* Local State with Validation */}
          <div>
            <label className="block text-sm font-medium mb-2">Local State with Validation:</label>
            <Input
              value={localText}
              onChange={(e) => setLocalText(e.target.value)}
              placeholder="Enter text..."
              className={localError ? 'border-red-500' : ''}
            />
            {localError && <p className="text-red-500 text-sm mt-1">{localError}</p>}
          </div>

          {/* Toggle State */}
          <div>
            <label className="block text-sm font-medium mb-2">Toggle State:</label>
            <Button onClick={toggleVisibility}>
              {isVisible ? 'Hide' : 'Show'} Content
            </Button>
            {isVisible && (
              <div className="mt-2 p-2 bg-gray-100 rounded">
                This content is toggled with local state!
              </div>
            )}
          </div>

          {/* Counter State */}
          <div>
            <label className="block text-sm font-medium mb-2">Counter State:</label>
            <div className="flex items-center gap-2">
              <Button onClick={decrement} disabled={count === 0}>-</Button>
              <span className="px-4 py-2 bg-gray-100 rounded">{count}</span>
              <Button onClick={increment} disabled={count === 10}>+</Button>
              <Button onClick={resetCounter} variant="secondary">Reset</Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Form State Example */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">2. Form State with useReducer</h2>
        
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name:</label>
            <Input
              value={form.values.name}
              onChange={(e) => form.setValue('name', e.target.value)}
              onBlur={() => form.setTouched('name', true)}
              className={form.touched.name && form.errors.name ? 'border-red-500' : ''}
            />
            {form.touched.name && form.errors.name && (
              <p className="text-red-500 text-sm mt-1">{form.errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email:</label>
            <Input
              type="email"
              value={form.values.email}
              onChange={(e) => form.setValue('email', e.target.value)}
              onBlur={() => form.setTouched('email', true)}
              className={form.touched.email && form.errors.email ? 'border-red-500' : ''}
            />
            {form.touched.email && form.errors.email && (
              <p className="text-red-500 text-sm mt-1">{form.errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Age:</label>
            <Input
              type="number"
              value={form.values.age}
              onChange={(e) => form.setValue('age', parseInt(e.target.value) || 0)}
              onBlur={() => form.setTouched('age', true)}
              className={form.touched.age && form.errors.age ? 'border-red-500' : ''}
            />
            {form.touched.age && form.errors.age && (
              <p className="text-red-500 text-sm mt-1">{form.errors.age}</p>
            )}
          </div>

          <Button type="submit" disabled={!form.isValid || form.isSubmitting}>
            {form.isSubmitting ? 'Submitting...' : 'Submit Form'}
          </Button>
        </form>
      </Card>

      {/* Data Props Examples */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">3. Data Props (URL & Layout)</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Search Parameters:</label>
            <div className="flex gap-2">
              <Input
                value={searchData.category}
                onChange={(e) => updateSearch({ category: e.target.value })}
                placeholder="Category..."
              />
              <Input
                type="number"
                value={searchData.price}
                onChange={(e) => updateSearch({ price: parseInt(e.target.value) || 0 })}
                placeholder="Price..."
              />
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Current: {searchData.category} - ${searchData.price}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Layout Data:</label>
            <Button
              onClick={() => setLayoutData({ ...layoutData, sidebarCollapsed: !layoutData.sidebarCollapsed })}
            >
              Toggle Sidebar ({layoutData.sidebarCollapsed ? 'Collapsed' : 'Expanded'})
            </Button>
            <p className="text-sm text-gray-600 mt-1">
              Last visited: {new Date(layoutData.lastVisited).toLocaleString()}
            </p>
          </div>
        </div>
      </Card>

      {/* Global State Examples */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">4. Global State (Zustand)</h2>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={toggleSidebar}>
              Toggle Sidebar ({sidebarOpen ? 'Open' : 'Closed'})
            </Button>
            <Button onClick={() => openModal('example-modal')}>
              Open Modal
            </Button>
            <Button onClick={closeModal} variant="secondary">
              Close Modal
            </Button>
          </div>
          
          <p className="text-sm text-gray-600">
            Modal state: {modalOpen ? 'Open' : 'Closed'}
          </p>
        </div>
      </Card>

      {/* Context Examples */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">5. Context API Examples</h2>
        
        <div className="space-y-4">
          {/* Auth Context */}
          <div>
            <h3 className="font-medium mb-2">Authentication:</h3>
            {isAuthenticated ? (
              <div className="space-y-2">
                <p className="text-sm">Welcome, {user?.name}!</p>
                                 <Button onClick={logout} variant="secondary">Logout</Button>
              </div>
            ) : (
              <Button onClick={handleLogin}>Login</Button>
            )}
          </div>

          {/* Cart Context */}
          <div>
            <h3 className="font-medium mb-2">Shopping Cart:</h3>
            <div className="flex gap-2">
              <Button onClick={handleAddToCart}>Add to Cart</Button>
              <span className="px-3 py-2 bg-gray-100 rounded">
                Items: {getCartCount()}
              </span>
            </div>
            {items.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium">Cart Items:</p>
                <ul className="text-sm text-gray-600">
                  {items.map((item) => (
                    <li key={item.id} className="flex justify-between">
                      <span>{item.name}</span>
                                             <Button
                         onClick={() => removeFromCart(item.id)}
                         variant="secondary"
                         size="sm"
                       >
                         Remove
                       </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Theme Context */}
          <div>
            <h3 className="font-medium mb-2">Theme:</h3>
            <div className="flex gap-2">
                             <Button
                 onClick={() => setTheme('light')}
                 variant={theme === 'light' ? 'primary' : 'secondary'}
               >
                 Light
               </Button>
               <Button
                 onClick={() => setTheme('dark')}
                 variant={theme === 'dark' ? 'primary' : 'secondary'}
               >
                 Dark
               </Button>
               <Button
                 onClick={() => setTheme('system')}
                 variant={theme === 'system' ? 'primary' : 'secondary'}
               >
                 System
               </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Toast Examples */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">6. Toast Notifications</h2>
        
        <div className="flex gap-2">
          <Button onClick={() => toast.success('Success!', 'Operation completed successfully')}>
            Success Toast
          </Button>
          <Button onClick={() => toast.error('Error!', 'Something went wrong')}>
            Error Toast
          </Button>
          <Button onClick={() => toast.warning('Warning!', 'Please check your input')}>
            Warning Toast
          </Button>
          <Button onClick={() => toast.info('Info!', 'Here is some information')}>
            Info Toast
          </Button>
        </div>
      </Card>

      {/* State Summary */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">State Summary</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-medium mb-2">Local State:</h3>
            <ul className="space-y-1 text-gray-600">
              <li>• Text: "{localText}"</li>
              <li>• Counter: {count}</li>
              <li>• Visible: {isVisible ? 'Yes' : 'No'}</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Global State:</h3>
            <ul className="space-y-1 text-gray-600">
              <li>• Sidebar: {sidebarOpen ? 'Open' : 'Closed'}</li>
              <li>• Modal: {modalOpen ? 'Open' : 'Closed'}</li>
              <li>• Cart Items: {getCartCount()}</li>
              <li>• Theme: {theme}</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
} 