export function ArtCreaLogo({ className = "h-5" }) {
  return (
    <img 
      src="/ART-crea.svg" 
      alt="Logo ART-créa" 
      width="35"
      height="20"
      className={`${className} w-auto object-contain inline-block align-middle select-none`}
      draggable={false}
    />
  )
}
