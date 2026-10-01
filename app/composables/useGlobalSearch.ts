export const useGlobalSearch = () => {
  const isOpen = useState('global-search-open', () => false)

  const openSearch = () => {
    isOpen.value = true
  }

  return { isOpen, openSearch }
}
