import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Types
export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
  category: string
  sellerId: string
}

interface CartState {
  items: CartItem[]
  totalItems: number
  totalPrice: number
  isOpen: boolean
}

interface CartActions {
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
}

type CartStore = CartState & CartActions

// Initial state
const initialState: CartState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
  isOpen: false,
}

// Create store
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      addItem: (item) => {
        set((state) => {
          const existingItem = state.items.find((i) => i.id === item.id)
          
          if (existingItem) {
            // Update quantity if item already exists
            const updatedItems = state.items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            )
            return {
              items: updatedItems,
              totalItems: state.totalItems + 1,
              totalPrice: state.totalPrice + item.price,
            }
          } else {
            // Add new item
            const newItem: CartItem = { ...item, quantity: 1 }
            return {
              items: [...state.items, newItem],
              totalItems: state.totalItems + 1,
              totalPrice: state.totalPrice + item.price,
            }
          }
        })
      },

      removeItem: (itemId) => {
        set((state) => {
          const item = state.items.find((i) => i.id === itemId)
          if (!item) return state

          const updatedItems = state.items.filter((i) => i.id !== itemId)
          return {
            items: updatedItems,
            totalItems: state.totalItems - item.quantity,
            totalPrice: state.totalPrice - item.price * item.quantity,
          }
        })
      },

      updateQuantity: (itemId, quantity) => {
        set((state) => {
          const item = state.items.find((i) => i.id === itemId)
          if (!item) return state

          const quantityDiff = quantity - item.quantity
          const updatedItems = state.items.map((i) =>
            i.id === itemId ? { ...i, quantity } : i
          )

          return {
            items: updatedItems,
            totalItems: state.totalItems + quantityDiff,
            totalPrice: state.totalPrice + item.price * quantityDiff,
          }
        })
      },

      clearCart: () => {
        set(initialState)
      },

      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen }))
      },

      openCart: () => {
        set({ isOpen: true })
      },

      closeCart: () => {
        set({ isOpen: false })
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
        totalItems: state.totalItems,
        totalPrice: state.totalPrice,
      }),
    }
  )
) 