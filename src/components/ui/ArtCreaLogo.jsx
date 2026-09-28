export function ArtCreaLogo({ className = "h-5" }) {
  return (
    <img 
      src="/ART-crea.svg" 
      alt="Logo ART-créa" 
      className={`${className} object-contain inline-block align-middle select-none`}
      draggable={false}
    />
  )
}
