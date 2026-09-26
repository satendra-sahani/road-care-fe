import type { GetStaticProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { SEOHead } from '@/components/SEOHead'
import { UserLayout } from '@/components/layout/UserLayout'
import { DImg } from '@/components/ui/DImg'
import { PHONE, PHONE_HREF } from '@/components/blog/BlogBlocks'
import type { PostCard } from '@/data/blog/types'
import { IcCall, IcBuild, IcLocationOn, IcChevronRight, IcSchedule } from '@/components/icons/BmIcons'

const SITE = 'https://bharatmechanics.com'

interface DistrictGroup {
  key: string
  name: string
  hi: string
  context: string
  cities: PostCard[]
}

interface Props {
  guides: PostCard[]
  districts: DistrictGroup[]
}

export default function BlogIndex({ guides, districts }: Props) {
  const total = districts.reduce((n, d) => n + d.cities.length, 0)
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'Bharat Mechanics Blog',
      url: `${SITE}/blog`,
      inLanguage: 'en-IN',
      publisher: { '@type': 'Organization', name: 'Bharat Mechanics', url: SITE, logo: `${SITE}/brand-logo-v3.png` },
      blogPost: guides.map((g) => ({ '@type': 'BlogPosting', headline: g.title, url: `${SITE}/blog/${g.slug}` })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog` },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Bharat Mechanics service areas',
      itemListElement: districts.flatMap((d) => d.cities).map((c, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/blog/${c.slug}`, name: `Mechanic in ${c.cityName}` })),
    },
  ]

  return (
    <>
      <SEOHead
        title="Car & Bike Care Blog & Service Areas"
        description="Car and bike care guides for Gorakhpur, Deoria, Kushinagar and Maharajganj — service prices, monsoon, fog and festive-trip tips, and mechanics in 40+ towns."
        keywords="mechanic near me Gorakhpur, bike mistri near me, car repair near me Deoria, bike mechanic Kushinagar, puncture repair near me, car service at home Gorakhpur, Padrauna mechanic, Kasia car service, towing service near me, car care tips Purvanchal, Bharat Mechanics blog"
      />
      <Head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      </Head>
      <UserLayout>
        <div className="bg-[#F5F8FC] text-[#0E2B4C] [overflow-x:clip]">
          {/* ── Hero ── */}
          <header className="border-b border-[#E6ECF3] bg-[linear-gradient(180deg,#FFFFFF,#F5F8FC)]">
            <div className="mx-auto grid max-w-[1220px] items-center gap-8 px-[clamp(14px,3vw,24px)] pb-9 pt-6 md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_360px]">
              <div>
                <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[12.5px] text-[#52667C]">
                  <Link href="/" className="hover:text-[#0E2B4C]">Home</Link>
                  <IcChevronRight size={14} />
                  <span className="text-[#0E2B4C]" aria-current="page">Blog</span>
                </nav>
                <h1 className="mt-4 text-[28px] font-bold leading-[1.15] tracking-[-0.01em] sm:text-[36px] lg:text-[44px]">
                  Car &amp; bike care guides for <span className="text-[#F4601F]">Purvanchal</span>
                </h1>
                <p className="mt-4 max-w-[640px] text-[15.5px] leading-[1.75] text-[#41586F] sm:text-[16.5px]">
                  Honest advice on servicing, prices and safe driving for Gorakhpur, Deoria, Kushinagar and Maharajganj — plus doorstep mechanic service in {total}+ towns and villages.
                </p>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  <a href="#service-areas" className="inline-flex h-12 items-center gap-2 rounded-full bg-[#C94309] px-6 text-[15px] font-semibold text-white shadow-[0_8px_20px_rgba(201,67,9,0.28)] hover:bg-[#A93807] hover:text-white">
                    <IcLocationOn size={18} /> Find your town
                  </a>
                  <a href={PHONE_HREF} className="inline-flex h-12 items-center gap-2 rounded-full border border-[#D6E2F0] bg-white px-6 text-[15px] font-semibold text-[#0E2B4C] hover:bg-[#F2F6FC]">
                    <IcCall size={18} /> {PHONE}
                  </a>
                </div>
              </div>
              <div className="relative mx-auto hidden aspect-square w-full max-w-[340px] items-end justify-center overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_50%_40%,#FFE3D0,#FDF2EA_60%,#F5F8FC)] md:flex">
                <DImg src="/design/sv-girl.webp" alt="Bharat Mechanics technician" loading="eager" sizes="340px" className="h-[94%] w-auto object-contain" />
              </div>
            </div>
          </header>

          {/* ── Trending guides ── */}
          <section className="mx-auto max-w-[1220px] px-[clamp(14px,3vw,24px)] py-9">
            <h2 className="flex items-center gap-3 text-[22px] font-bold sm:text-[26px]"><span aria-hidden className="h-[3px] w-6 rounded-full bg-[#F4601F]" />Trending guides</h2>
            <p className="mt-1 text-[14px] text-[#52667C]">Seasonal advice for the roads of eastern Uttar Pradesh.</p>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {guides.map((g, i) => (
                <li key={g.slug} className={i === 0 ? 'sm:col-span-2 lg:col-span-1' : ''}>
                  <Link href={`/blog/${g.slug}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#E6ECF3] bg-white transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-[2px] hover:border-[#F4B48F] hover:shadow-[0_16px_34px_-20px_rgba(14,43,76,0.45)]">
                    <div className="flex h-[140px] items-center justify-center bg-[linear-gradient(135deg,#FFF3EA,#EEF4FC)] p-4">
                      <DImg src={g.heroImg} alt="" sizes="260px" className="max-h-full w-auto max-w-full object-contain" />
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <span className="text-[11.5px] font-semibold uppercase tracking-wide text-[#B83E08]">{g.category}</span>
                      <h3 className="mt-1.5 text-[16px] font-semibold leading-snug group-hover:text-[#B83E08]">{g.title}</h3>
                      <p className="mt-2 line-clamp-3 text-[13.5px] leading-relaxed text-[#52667C]">{g.excerpt}</p>
                      <span className="mt-auto inline-flex items-center gap-1 pt-3 text-[12.5px] text-[#52667C]"><IcSchedule size={14} /> {g.readMins} min read</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* ── Service areas ── */}
          <section id="service-areas" className="scroll-mt-20 border-t border-[#E6ECF3] bg-white">
            <div className="mx-auto max-w-[1220px] px-[clamp(14px,3vw,24px)] py-10">
              <h2 className="flex items-center gap-3 text-[22px] font-bold sm:text-[26px]"><span aria-hidden className="h-[3px] w-6 rounded-full bg-[#F4601F]" />Find a mechanic near you</h2>
              <p className="mt-1 max-w-[720px] text-[14px] leading-relaxed text-[#52667C]">
                Doorstep car and bike service, repairs and roadside help across four districts. Pick your town for local prices, driving tips and booking details.
              </p>

              <div className="mt-6 space-y-8">
                {districts.map((d) => (
                  <div key={d.key} id={`${d.key}-district`} className="scroll-mt-20">
                    <h3 className="text-[18px] font-bold sm:text-[20px]">
                      {d.name} district <span lang="hi" className="font-medium text-[#52667C]">· {d.hi}</span>
                    </h3>
                    <p className="mt-1 max-w-[860px] text-[13.5px] leading-relaxed text-[#52667C]">{d.context}</p>
                    <ul className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
                      {d.cities.map((c) => (
                        <li key={c.slug}>
                          <Link href={`/blog/${c.slug}`} className="flex h-full items-center gap-2.5 rounded-xl border border-[#E6ECF3] bg-[#F9FBFE] px-3 py-2.5 transition-colors hover:border-[#F4601F]">
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#FFEDE1] text-[#C94309]"><IcLocationOn size={16} /></span>
                            <span className="min-w-0">
                              <span className="block text-[14px] font-semibold leading-tight">{c.cityName}</span>
                              <span className="block truncate text-[11.5px] text-[#52667C]">Car &amp; bike mechanic</span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-4 rounded-2xl bg-[linear-gradient(135deg,#0E2B4C,#123A66)] p-5 text-white sm:p-6">
                <div className="min-w-0 flex-[1_1_260px]">
                  <p className="text-[18px] font-bold">Don’t see your village?</p>
                  <p className="mt-1 text-[13.5px] text-[#C9D6E6]">Enter your address while booking — or call us and we’ll tell you the nearest available mechanic.</p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <Link href="/service" className="inline-flex h-11 items-center gap-2 rounded-full bg-[#C94309] px-5 text-[14px] font-semibold text-white hover:bg-[#A93807] hover:text-white"><IcBuild size={17} /> Book a Service</Link>
                  <a href={PHONE_HREF} className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-[#0E2B4C] hover:bg-[#EEF2F7]"><IcCall size={17} /> Call us</a>
                </div>
              </div>
            </div>
          </section>
        </div>
      </UserLayout>
    </>
  )
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const { getIndexData } = await import('@/data/blog/posts')
  return { props: getIndexData() }
}
