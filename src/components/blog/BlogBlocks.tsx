import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Block } from '@/data/blog/types'
import { IcCall, IcArrowForward, IcLightbulb, IcBuild } from '@/components/icons/BmIcons'

/** Inline markup: **bold** and [label](/href). Internal links use next/link. */
export function Rich({ text }: { text: string }) {
  const out: ReactNode[] = []
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g
  let last = 0
  let m: RegExpExecArray | null
  let k = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    if (m[1]) out.push(<strong key={k++} className="font-semibold text-[#0E2B4C]">{m[1]}</strong>)
    else if (m[3].startsWith('/')) out.push(<Link key={k++} href={m[3]} className="font-medium text-[#1864C8] underline decoration-[#1864C8]/30 underline-offset-2 hover:decoration-[#1864C8]">{m[2]}</Link>)
    else out.push(<a key={k++} href={m[3]} rel="noopener" className="font-medium text-[#1864C8] underline underline-offset-2">{m[2]}</a>)
    last = re.lastIndex
  }
  if (last < text.length) out.push(text.slice(last))
  return <>{out}</>
}

export const PHONE = '+91 93106 94349'
export const PHONE_HREF = 'tel:+919310694349'

function Cta({ type, city }: { type: 'book' | 'call' | 'roadside'; city?: string }) {
  const book = city ? `/service?location=${encodeURIComponent(city)}` : '/service'
  const title =
    type === 'roadside' ? 'Stuck on the road?' : city ? `Book a mechanic in ${city}` : 'Book a doorstep service'
  const sub =
    type === 'roadside'
      ? 'Jump-start, puncture, fuel delivery or towing — share your location and help is on the way.'
      : 'Verified mechanics · Genuine parts · 30-day warranty · Pay after service'
  return (
    <div className="my-6 flex flex-wrap items-center gap-4 rounded-2xl bg-[linear-gradient(135deg,#0E2B4C,#123A66)] p-5 text-white sm:p-6">
      <div className="min-w-0 flex-[1_1_260px]">
        <p className="text-[17px] font-bold leading-snug sm:text-[19px]">{title}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-[#C9D6E6]">{sub}</p>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {type !== 'roadside' && (
          <Link href={book} className="inline-flex h-11 items-center gap-2 rounded-full bg-[#C94309] px-5 text-[14px] font-semibold text-white hover:bg-[#A93807] hover:text-white">
            <IcBuild size={17} /> Book a Service
          </Link>
        )}
        <a href={PHONE_HREF} className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-[#0E2B4C] hover:bg-[#EEF2F7]">
          <IcCall size={17} /> {type === 'roadside' ? `Call ${PHONE}` : 'Call us'}
        </a>
        {type === 'roadside' && (
          <Link href="/services" className="inline-flex h-11 items-center gap-1.5 rounded-full border border-white/40 px-5 text-[14px] font-semibold text-white hover:bg-white/10 hover:text-white">
            Roadside Assistance <IcArrowForward size={16} />
          </Link>
        )}
      </div>
    </div>
  )
}

export function BlogBlock({ b }: { b: Block }) {
  if ('p' in b) return <p className="my-4"><Rich text={b.p} /></p>
  if ('ul' in b)
    return (
      <ul className="my-4 space-y-2.5 pl-1">
        {b.ul.map((t, i) => (
          <li key={i} className="relative pl-6 before:absolute before:left-0 before:top-[0.62em] before:h-2 before:w-2 before:rounded-full before:bg-[#F4601F]">
            <Rich text={t} />
          </li>
        ))}
      </ul>
    )
  if ('ol' in b)
    return (
      <ol className="my-4 space-y-3 [counter-reset:step]">
        {b.ol.map((t, i) => (
          <li key={i} className="relative pl-10 [counter-increment:step] before:absolute before:left-0 before:top-0 before:grid before:h-7 before:w-7 before:place-items-center before:rounded-full before:bg-[#FFEDE1] before:text-[13px] before:font-bold before:text-[#B83E08] before:content-[counter(step)]">
            <Rich text={t} />
          </li>
        ))}
      </ol>
    )
  if ('table' in b)
    return (
      <figure className="my-5">
        <div className="overflow-x-auto rounded-2xl border border-[#E6ECF3] bg-white">
          <table className="w-full min-w-[520px] border-collapse text-left text-[14px]">
            <thead>
              <tr className="bg-[#F2F6FC] text-[12.5px] uppercase tracking-wide text-[#41586F]">
                {b.table.head.map((h) => <th key={h} scope="col" className="px-4 py-3 font-semibold">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {b.table.rows.map((r, i) => (
                <tr key={i} className="border-t border-[#EDF1F6] align-top">
                  {r.map((c, j) => (
                    <td key={j} className={`px-4 py-3 ${j === 0 ? 'font-semibold text-[#0E2B4C]' : /^₹/.test(c) ? 'whitespace-nowrap font-bold text-[#0F7040]' : 'text-[#41586F]'}`}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {b.table.caption && <figcaption className="mt-2 text-[12.5px] text-[#52667C]">{b.table.caption}</figcaption>}
      </figure>
    )
  if ('tip' in b)
    return (
      <aside className="my-5 flex gap-3 rounded-2xl border border-[#F8D9C4] bg-[#FFF6EF] p-4">
        <IcLightbulb size={22} className="mt-0.5 shrink-0 text-[#C94309]" />
        <div>
          {b.title && <p className="font-semibold text-[#0E2B4C]">{b.title}</p>}
          <p className="text-[#41586F]"><Rich text={b.tip} /></p>
        </div>
      </aside>
    )
  if ('hi' in b)
    return (
      <aside lang="hi" className="my-5 rounded-2xl border border-[#DCE7F5] bg-[#F2F7FD] p-4">
        {b.title && <p className="mb-1 font-semibold text-[#0E2B4C]">{b.title}</p>}
        <p className="text-[#2F4A66]">{b.hi}</p>
      </aside>
    )
  if ('cta' in b) return <Cta type={b.cta} city={b.city} />
  return null
}
