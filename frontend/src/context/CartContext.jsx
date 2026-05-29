import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { getCart } from '../api/panier'

const CartContext = createContext({ cartCount: 0, refreshCart: () => {} })

export function CartProvider({ children }) {
  const [cartCount, setCartCount] = useState(0)

  const refreshCart = useCallback(async () => {
    try {
      const data = await getCart()
      setCartCount(data.items?.length ?? 0)
    } catch {
      setCartCount(0)
    }
  }, [])

  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  return (
    <CartContext.Provider value={{ cartCount, refreshCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
