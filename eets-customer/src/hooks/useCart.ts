import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cartApi } from '../api/cart.api'
import { useCartStore } from '../store/cart.store'
import { toast } from 'react-hot-toast'

export const useCart = () => {
  const queryClient = useQueryClient()
  const { cart, setCart, clearCartLocal, setDrawerOpen } = useCartStore()

  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const currentCart = await cartApi.getCart()
      setCart(currentCart)
      return currentCart
    },
    retry: false,
  })

  const addToCartMutation = useMutation({
    mutationFn: cartApi.addToCart,
    onSuccess: (updatedCart) => {
      setCart(updatedCart)
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      toast.success('Added to cart')
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to add item'
      toast.error(msg)
    },
  })

  const updateCartItemMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      cartApi.updateCartItem(itemId, { quantity }),
    onSuccess: (updatedCart) => {
      setCart(updatedCart)
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update cart')
    },
  })

  const clearCartMutation = useMutation({
    mutationFn: cartApi.clearCart,
    onSuccess: () => {
      clearCartLocal()
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      toast.success('Cart cleared')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to clear cart')
    },
  })

  const applyCouponMutation = useMutation({
    mutationFn: cartApi.applyCoupon,
    onSuccess: (updatedCart) => {
      setCart(updatedCart)
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      toast.success('Coupon applied successfully!')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Invalid coupon code')
    },
  })

  const removeCouponMutation = useMutation({
    mutationFn: cartApi.removeCoupon,
    onSuccess: (updatedCart) => {
      setCart(updatedCart)
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      toast.success('Coupon removed')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to remove coupon')
    },
  })

  return {
    cart,
    isLoading: cartQuery.isLoading,
    isError: cartQuery.isError,
    refetchCart: cartQuery.refetch,
    addToCart: addToCartMutation.mutateAsync,
    isAdding: addToCartMutation.isPending,
    updateQuantity: updateCartItemMutation.mutate,
    clearCart: clearCartMutation.mutateAsync,
    isClearing: clearCartMutation.isPending,
    applyCoupon: applyCouponMutation.mutate,
    isApplyingCoupon: applyCouponMutation.isPending,
    removeCoupon: removeCouponMutation.mutate,
    isRemovingCoupon: removeCouponMutation.isPending,
    setDrawerOpen,
  }
}
export default useCart
