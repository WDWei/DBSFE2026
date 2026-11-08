import styles from './Skeleton.module.css'

interface SkeletonProps {
  width?: string
  height?: string
  className?: string
}

export function Skeleton({  width = '100%', height = '1em', className }: SkeletonProps) {
  const style: React.CSSProperties = { width, height }
  return (
    <span
      aria-hidden="true"
      className={[styles.skeleton, className].filter(Boolean).join(' ')}
      style={style}
    />
  )
}
