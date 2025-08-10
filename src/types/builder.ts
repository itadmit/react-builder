export type DeviceBreakpoint = 'desktop' | 'tablet' | 'mobile'

// סוגי הווידג'טים הנתמכים
export type WidgetType =
  | 'heading'
  | 'text'
  | 'button'
  | 'divider'
  | 'spacer'
  | 'image'
  | 'video'
  | 'gallery'
  | 'banner'
  | 'marquee'
  | 'productSlider'
  | 'newsletter'
  | 'html'
  | 'container'

export type SpacingValue = {
  top?: number | string
  right?: number | string
  bottom?: number | string
  left?: number | string
}

export type Alignment = 'start' | 'center' | 'end'
export type TextAlign = 'left' | 'center' | 'right'
export type FlexDirection = 'row' | 'column'
export type FlexJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
export type FlexAlign = 'start' | 'center' | 'end' | 'stretch'

export type StyleValues = {
  margin?: SpacingValue
  padding?: SpacingValue
  background?: string
  color?: string
  fontFamily?: string
  borderRadius?: number
  borderColor?: string
  borderWidth?: number
  borderStyle?: 'solid' | 'dashed' | 'dotted'
  width?: string
  maxWidth?: string
  minHeight?: number | string
  textAlign?: TextAlign
  fontSize?: number
  fontWeight?: number
  aspectRatio?: number | string
  lineHeight?: number
  letterSpacing?: number
  zIndex?: number
  position?: 'static' | 'relative' | 'absolute'
  top?: number
  right?: number
  bottom?: number
  left?: number
  shadow?: { x?: number; y?: number; blur?: number; spread?: number; color?: string }
}

export type ResponsiveStyle = Partial<Record<DeviceBreakpoint, StyleValues>>

export type WidgetCommon = {
  id: string
  type: WidgetType
  visible: boolean
  style?: StyleValues
  responsiveStyle?: ResponsiveStyle
  advanced?: {
    anchorId?: string
    hiddenOn?: Partial<Record<DeviceBreakpoint, boolean>>
    customCss?: string
  }
  // שדות אופציונליים נפוצים בפועל בקומפוננטות הרנדר/אינספקטור כדי לצמצם שגיאות יוניון בזמן בנייה
  // טיפוסיות עדיין נבדקות ע"י תנאי type === 'X' לפני שימוש משמעותי
  content?: string
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  href?: string
  label?: string
  icon?: 'none' | 'arrow-right' | 'arrow-left' | 'shopping-cart'
  hoverStyle?: StyleValues
  thickness?: number
  height?: number | string
  src?: string
  alt?: string
  linkHref?: string
  objectFit?: 'cover' | 'contain'
  lazy?: boolean
  caption?: string
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  controls?: boolean
  images?: Array<{ id: string; src: string; alt?: string; caption?: string; linkHref?: string }>
  columns?: number
  gap?: number
  columnsChildren?: Widget[][]
  responsiveColumns?: Partial<Record<DeviceBreakpoint, number>>
  children?: Widget[]
  backgroundImage?: string
  backgroundVideoUrl?: string
  // מקורות למדיה במובייל
  backgroundImageMobile?: string
  backgroundVideoUrlMobile?: string
  overlayColor?: string
  heading?: string
  text?: string
  ctaLabel?: string
  ctaHref?: string
  contentPosition?: { horizontal: Alignment; vertical: Alignment }
  headingStyle?: StyleValues
  textStyle?: StyleValues
  buttonStyle?: StyleValues
  buttonHoverStyle?: StyleValues
  speed?: number
  html?: string
  productIds?: string[]
  slidesPerView?: Partial<Record<DeviceBreakpoint, number>>
  arrows?: boolean
  dots?: boolean
  title?: string
  flex?: {
    direction: FlexDirection
    justify?: FlexJustify
    align?: FlexAlign
    wrap?: 'nowrap' | 'wrap'
    gap?: number
  }
}

export type HeadingWidget = WidgetCommon & {
  type: 'heading'
  content: string
  tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  href?: string
}

export type TextWidget = WidgetCommon & {
  type: 'text'
  content: string
}

export type ButtonWidget = WidgetCommon & {
  type: 'button'
  label: string
  href?: string
  // סגנון ויזואלי של הכפתור: מלא, מתאר, טקסט בלבד או טקסט עם קו תחתון
  variant?: 'filled' | 'outline' | 'text' | 'underline'
  icon?: 'none' | 'arrow-right' | 'arrow-left' | 'shopping-cart'
  hoverStyle?: StyleValues
}

export type DividerWidget = WidgetCommon & {
  type: 'divider'
  thickness?: number
}

export type SpacerWidget = WidgetCommon & {
  type: 'spacer'
  height: number | string
}

export type ImageWidget = WidgetCommon & {
  type: 'image'
  src: string
  // מקור ייעודי למובייל (ברירת מחדל נופל ל-src)
  mobileSrc?: string
  alt?: string
  linkHref?: string
  objectFit?: 'cover' | 'contain'
  lazy?: boolean
  caption?: string
}

export type VideoWidget = WidgetCommon & {
  type: 'video'
  src: string
  // מקור ייעודי למובייל (ברירת מחדל נופל ל-src)
  mobileSrc?: string
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  controls?: boolean
}

export type GalleryWidget = WidgetCommon & {
  type: 'gallery'
  images: Array<{ id: string; src: string; alt?: string; caption?: string; linkHref?: string }>
  columns?: number
  gap?: number
}

export type BannerWidget = WidgetCommon & {
  type: 'banner'
  backgroundImage?: string
  backgroundVideoUrl?: string
  overlayColor?: string
  heading?: string
  text?: string
  ctaLabel?: string
  ctaHref?: string
  // New rich controls
  contentAlign?: Alignment // legacy; kept for backward-compat
  contentPosition?: { horizontal: Alignment; vertical: Alignment }
  headingStyle?: StyleValues
  textStyle?: StyleValues
  buttonStyle?: StyleValues
  buttonHoverStyle?: StyleValues
  // Button layout controls
  buttonWidth?: 'auto' | 'full'
  buttonAlign?: Alignment
  buttonVariant?: 'filled' | 'outline' | 'text' | 'underline'
}

export type MarqueeWidget = WidgetCommon & {
  type: 'marquee'
  text: string
  speed?: number
}

export type ProductSliderWidget = WidgetCommon & {
  type: 'productSlider'
  title?: string
  productIds: string[]
  // מוקאפים להצגה וביניים עד חיבור לשרת
  products?: Array<{ id: string; title: string; price?: number; image?: string; href?: string }>
  categoryIds?: Array<number | string>
  limit?: number
  manualSelection?: boolean
  selectedProductIds?: Array<number | string>
  selectedProductsMeta?: Array<{ id: number | string; name: string; image?: string }>
  slidesPerView?: Partial<Record<DeviceBreakpoint, number>>
  arrows?: boolean
  dots?: boolean
  autoplay?: boolean
  arrowSize?: number
  arrowColor?: string
}

export type HtmlWidget = WidgetCommon & {
  type: 'html'
  html: string
}

export type NewsletterWidget = WidgetCommon & {
  type: 'newsletter'
  title?: string
  description?: string
  placeholder?: string
  label?: string
  showName?: boolean
  showPhone?: boolean
  checkboxEnabled?: boolean
  checkboxLabelHtml?: string
  buttonLabel?: string
  successMessage?: string
  align?: 'left' | 'center' | 'right'
  inputRadius?: number
  buttonRadius?: number
  inputWidth?: '15%' | '33%' | '50%' | '75%' | '100%'
}

export type ContainerWidget = WidgetCommon & {
  type: 'container'
  flex?: {
    direction: FlexDirection
    justify?: FlexJustify
    align?: FlexAlign
    wrap?: 'nowrap' | 'wrap'
    gap?: number
  }
  columns?: number
  columnsChildren?: Widget[][]
  children: Widget[]
}

export type Widget =
  | HeadingWidget
  | TextWidget
  | ButtonWidget
  | DividerWidget
  | SpacerWidget
  | ImageWidget
  | VideoWidget
  | GalleryWidget
  | BannerWidget
  | MarqueeWidget
  | ProductSliderWidget
  | NewsletterWidget
  | HtmlWidget
  | ContainerWidget

export type Section = {
  id: string
  container?: 'fixed' | 'fluid'
  style?: StyleValues
  responsiveStyle?: ResponsiveStyle
  advanced?: {
    anchorId?: string
    hiddenOn?: Partial<Record<DeviceBreakpoint, boolean>>
    customCss?: string
  }
  flex?: {
    direction: FlexDirection
    justify?: FlexJustify
    align?: FlexAlign
    wrap?: 'nowrap' | 'wrap'
    gap?: number
  }
  widgets: Widget[]
}

export type PageSchema = {
  id: string
  name: string
  meta?: {
    title?: string
    description?: string
  }
  sections: Section[]
}

export type SelectedTarget =
  | { kind: 'widget'; id: string }
  | { kind: 'section'; id: string }

