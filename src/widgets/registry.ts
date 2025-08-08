import type { Widget } from '@/types/builder'
import {
  Heading1,
  Text as TextIcon,
  MousePointerSquareDashed,
  Minus,
  MoveVertical,
  Image as ImageIcon,
  Video as VideoIcon,
  Images,
  Columns,
  Megaphone,
  MoveHorizontal,
  ShoppingCart,
  Code,
} from 'lucide-react'

export type WidgetBlueprint = { type: Widget['type']; label: string; icon: React.ComponentType<any>; create: () => Omit<Widget, 'id'> }

export const WIDGETS: WidgetBlueprint[] = [
  {
    type: 'container',
    label: 'עמודות',
    icon: Columns,
    create: () => ({ type: 'container', visible: true, style: { padding: { top: 16, bottom: 16 } }, flex: { direction: 'row', gap: 16 }, columns: 2, columnsChildren: [[], []], children: [] } as any),
  },
  {
    type: 'heading',
    label: 'כותרת',
    icon: Heading1,
    create: () => ({ type: 'heading', content: 'כותרת לדוגמה', tag: 'h2', visible: true, style: { fontSize: 24, lineHeight: 1, letterSpacing: 0 } }),
  },
  { type: 'text', label: 'טקסט', icon: TextIcon, create: () => ({ type: 'text', content: 'טקסט לדוגמה', visible: true, style: { fontSize: 16, lineHeight: 1, letterSpacing: 0, padding: { top: 12, right: 12, bottom: 12, left: 12 } } }) },
  { type: 'button', label: 'כפתור', icon: MousePointerSquareDashed, create: () => ({ type: 'button', label: 'לחצו כאן', visible: true, style: { background: '#111111', color: '#ffffff', padding: { top: 8, bottom: 8, left: 12, right: 12 } } }) },
  { type: 'divider', label: 'קו מפריד', icon: Minus, create: () => ({ type: 'divider', thickness: 1, visible: true, style: {} }) },
  { type: 'spacer', label: 'ריווח', icon: MoveVertical, create: () => ({ type: 'spacer', height: 24, visible: true, style: {} }) },
  { type: 'image', label: 'תמונה', icon: ImageIcon, create: () => ({ type: 'image', src: 'https://picsum.photos/800/400', visible: true, style: { borderRadius: 8 } }) },
  { type: 'video', label: 'וידאו', icon: VideoIcon, create: () => ({ type: 'video', src: 'https://www.w3schools.com/html/mov_bbb.mp4', controls: true, visible: true, style: {} }) },
  { type: 'gallery', label: 'גלריה', icon: Images, create: () => ({ type: 'gallery', images: [], columns: 3, gap: 12, visible: true, style: {} }) },
  { type: 'banner', label: 'באנר', icon: Megaphone, create: () => ({ type: 'banner', backgroundImage: 'https://picsum.photos/1200/500', overlayColor: 'rgba(0,0,0,0.5)', heading: '<strong>מבצע!</strong>', text: 'הנחות ענק', ctaLabel: 'לפרטים', visible: true, style: { minHeight: '360px' }, contentPosition: { horizontal: 'center', vertical: 'center' }, headingStyle: { fontSize: 28, fontWeight: 600, lineHeight: 1, color: '#ffffff' }, textStyle: { fontSize: 16, lineHeight: 1, color: '#ffffff' }, buttonStyle: { background: '#2563eb', color: '#ffffff', borderRadius: 6 } } as any) },
  { type: 'marquee', label: 'טקסט נע', icon: MoveHorizontal, create: () => ({ type: 'marquee', text: 'ברוכים הבאים לחנות שלנו', speed: 40, visible: true, style: {} }) },
  { type: 'productSlider', label: 'סליידר מוצרים', icon: ShoppingCart, create: () => ({ type: 'productSlider', title: 'מוצרים מומלצים', productIds: [], slidesPerView: { desktop: 4, tablet: 2, mobile: 1 }, arrows: true, dots: false, autoplay: false, visible: true, style: {} } as any) },
  { type: 'html', label: 'HTML', icon: Code, create: () => ({ type: 'html', html: '<div>תוכן HTML</div>', visible: true, style: {} }) },
]

