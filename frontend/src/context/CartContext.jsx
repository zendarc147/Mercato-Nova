import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { getCart } from '../api/panier'

const CartContext = createContext({ cartCount: 0, refreshCart: () => {} })

// Provider du panier : il garde seulement le nombre d'articles pour l'icone du header.
export function CartProvider({ children }) {
  const [cartCount, setCartCount] = useState(0)

  // useCallback evite de recreer la fonction a chaque rendu, utile pour les dependances React.
  const refreshCart = useCallback(async () => {
    try {
      const data = await getCart()
      setCartCount(data.items?.length ?? 0)
    } catch {
      setCartCount(0)
    }
  }, [])

  // Au premier affichage, on synchronise le compteur avec le panier du backend.
  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  return (
    <CartContext.Provider value={{ cartCount, refreshCart }}>
      {children}
    </CartContext.Provider>
  )
}

// Hook pratique pour acceder au compteur du panier dans les composants.
export function useCart() {
  return useContext(CartContext)
}
