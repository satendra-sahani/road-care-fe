import type { GetStaticPaths, GetStaticProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { SEOHead } from '@/components/SEOHead'
import { UserLayout } from '@/components/layout/UserLayout'
import { DImg } from '@/components/ui/DImg'
import { BlogBlock, PHONE, PHONE_HREF } from '@/components/blog/BlogBlocks'
import type { Post, PostCard } from '@/data/blog/types'
import { IcCall, IcBuild, IcSchedule, IcLocationOn, IcChevronRight, IcVerifiedUser, IcExpandMore } from '@/components/icons/BmIcons'

const SITE = 'https://bharatmechanics.com'
const ORG = { '@type': 'Organization', name: 'Bharat Mechanics', legalName: 'Bharat Mechanics Private Limited', url: SITE, logo: { '@type': 'ImageObject', url: `${SITE}/brand-logo-v3.png` } }

const fmtDate = (iso: string) => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

interface Props {
  post: Post
  related: PostCard[]
}

export default function BlogPost({ post, related }: Props) {
  const url = `${SITE}/blog/${post.slug}`
  const city = post.city
  const bookHref = city ? `/service?location=${encodeURIComponent(city.name)}` : '/service'

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      image: [`${SITE}${post.heroImg}`],
      datePublished: post.datePublished,
      dateModified: post.dateModified,
      inLanguage: 'en-IN',
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      author: ORG,
      publisher: ORG,
      keywords: post.keywords,
      articleSection: post.category,
      ...(city ? { about: { '@type': 'Place', name: `${city.name}, ${city.district} district, Uttar Pradesh` } } : {}),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog` },
        { '@type': 'ListItem', position: 3, name: post.metaTitle, item: url },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: post.faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
    ...(city
      ? [{
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: `Car & bike mechanic service in ${city.name}`,
          serviceType: 'Vehicle repair, maintenance and roadside assistance',
          provider: ORG,
          url,
          areaServed: {
            '@type': 'City',
            name: city.name,
            containedInPlace: { '@type': 'AdministrativeArea', name: `${city.district} district, Uttar Pradesh, India` },
          },
          offers: { '@type': 'Offer', priceCurrency: 'INR', price: '599', description: 'Oil change at your doorstep (starting price)' },
        }]
      : []),
  ]

  return (
    <>
      <SEOHead title={post.metaTitle} description={post.description} keywords={post.keywords} ogType="article" ogImage={`${SITE}${post.heroImg}`} />
      <Head>
        <meta property="article:published_time" content={post.datePublished} />
        <meta property="article:modified_time" content={post.dateModified} />
        <meta property="article:section" content={post.category} />
        {city && <meta name="geo.region" content="IN-UP" />}
        {city && <meta name="geo.placename" content={`${city.name}, ${city.district}`} />}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      </Head>
      <UserLayout>
        <div className="bg-[#F5F8FC] text-[#0E2B4C] [overflow-x:clip]">
          {/* ── Hero ── */}
          <header className="border-b border-[#E6ECF3] bg-[linear-gradient(180deg,#FFFFFF,#F5F8FC)]">
            <div className="mx-auto max-w-[1220px] px-[clamp(14px,3vw,24px)] pb-8 pt-5 md:pb-10">
              <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-[12.5px] text-[#52667C]">
                <Link href="/" className="hover:text-[#0E2B4C]">Home</Link>
                <IcChevronRight size={14} />
                <Link href="/blog" className="hover:text-[#0E2B4C]">Blog</Link>
                <IcChevronRight size={14} />
                <span className="max-w-[60vw] truncate text-[#0E2B4C]" aria-current="page">{city ? `Mechanic in ${city.name}` : post.category}</span>
              </nav>
              <div className="mt-5 grid items-center gap-8 md:grid-cols-[1fr_320px] lg:grid-cols-[1fr_380px]">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFEDE1] px-3 py-1 text-[12px] font-semibold text-[#B83E08]">
                    {city ? <IcLocationOn size={14} /> : null}
                    {post.category}
                  </span>
                  <h1 className="mt-3 text-[26px] font-bold leading-[1.18] tracking-[-0.01em] sm:text-[32px] lg:text-[40px]">{post.title}</h1>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[#52667C]">
                    <span>By Bharat Mechanics Team</span>
                    <span>Updated <time dateTime={post.dateModified}>{fmtDate(post.dateModified)}</time></span>
                    <span className="inline-flex items-center gap-1"><IcSchedule size={14} /> {post.readMins} min read</span>
                  </div>
                  <p className="mt-4 max-w-[720px] text-[15.5px] leading-[1.75] text-[#41586F] sm:text-[16.5px]">{post.intro}</p>
                  <div className="mt-5 flex flex-wrap gap-2.5">
                    <Link href={bookHref} className="inline-flex h-12 items-center gap-2 rounded-full bg-[#C94309] px-6 text-[15px] font-semibold text-white shadow-[0_8px_20px_rgba(201,67,9,0.28)] hover:bg-[#A93807] hover:text-white">
                      <IcBuild size={18} /> Book a Service
                    </Link>
                    <a href={PHONE_HREF} className="inline-flex h-12 items-center gap-2 rounded-full border border-[#D6E2F0] bg-white px-6 text-[15px] font-semibold text-[#0E2B4C] hover:bg-[#F2F6FC]">
                      <IcCall size={18} /> {PHONE}
                    </a>
                  </div>
                </div>
                <div className="relative mx-auto hidden aspect-[4/3.4] w-full max-w-[380px] items-end justify-center overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_50%_40%,#FFE3D0,#FDF2EA_60%,#F5F8FC)] md:flex">
                  <DImg src={post.heroImg} alt={post.heroAlt} loading="eager" sizes="380px" className="h-[92%] w-auto max-w-[92%] object-contain" />
                </div>
              </div>
            </div>
          </header>

          <div className="mx-auto grid max-w-[1220px] gap-8 px-[clamp(14px,3vw,24px)] py-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:py-10">
            {/* ── Article ── */}
            <article className="min-w-0 text-[15.5px] leading-[1.8] text-[#41586F] sm:text-[16px]">
              {/* Table of contents */}
              <details className="group mb-6 rounded-2xl border border-[#E6ECF3] bg-white p-4 lg:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-[#0E2B4C]">
                  In this guide <IcExpandMore size={20} className="transition-transform group-open:rotate-180" />
                </summary>
                <ol className="mt-3 space-y-1.5 text-[14px]">
                  {post.sections.map((s) => <li key={s.id}><a href={`#${s.id}`} className="text-[#1864C8] hover:underline">{s.h2}</a></li>)}
                  <li><a href="#faq" className="text-[#1864C8] hover:underline">Frequently asked questions</a></li>
                </ol>
              </details>

              {post.sections.map((s) => (
                <section key={s.id} id={s.id} className="scroll-mt-24">
                  <h2 className="mb-1 mt-9 flex items-start gap-3 text-[21px] font-bold leading-snug text-[#0E2B4C] first:mt-0 sm:text-[24px]" lang={/[ऀ-ॿ]/.test(s.h2) ? 'hi' : undefined}>
                    <span aria-hidden className="mt-[0.62em] h-[3px] w-6 shrink-0 rounded-full bg-[#F4601F]" />
                    {s.h2}
                  </h2>
                  {s.blocks.map((b, i) => <BlogBlock key={i} b={b} />)}
                </section>
              ))}

              {/* FAQ */}
              <section id="faq" className="scroll-mt-24">
                <h2 className="mb-4 mt-10 flex items-start gap-3 text-[21px] font-bold leading-snug text-[#0E2B4C] sm:text-[24px]">
                  <span aria-hidden className="mt-[0.62em] h-[3px] w-6 shrink-0 rounded-full bg-[#F4601F]" />
                  Frequently asked questions
                </h2>
                <div className="space-y-3">
                  {post.faqs.map((f, i) => (
                    <details key={i} className="group rounded-2xl border border-[#E6ECF3] bg-white px-5 py-4 open:shadow-[0_10px_28px_-18px_rgba(14,43,76,0.35)]" open={i === 0}>
                      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-[15.5px] font-semibold leading-snug text-[#0E2B4C]">
                        <h3 className="text-[15.5px] font-semibold">{f.q}</h3>
                        <IcExpandMore size={22} className="mt-[-1px] shrink-0 text-[#52667C] transition-transform group-open:rotate-180" />
                      </summary>
                      <p className="mt-2.5 text-[15px] leading-[1.75] text-[#41586F]">{f.a}</p>
                    </details>
                  ))}
                </div>
              </section>

              {/* Nearby areas */}
              {city && city.nearby.length > 0 && (
                <section className="mt-10 rounded-2xl border border-[#E6ECF3] bg-white p-5">
                  <h2 className="text-[18px] font-bold text-[#0E2B4C]">Mechanic service near {city.name}</h2>
                  <p className="mt-1 text-[14px] text-[#52667C]">We also serve these nearby towns and villages:</p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {city.nearby.map((n) => (
                      <li key={n.slug}>
                        <Link href={`/blog/${n.slug}`} className="inline-flex items-center gap-1.5 rounded-full border border-[#D6E2F0] bg-[#F7FAFE] px-3.5 py-1.5 text-[13.5px] font-medium text-[#0E2B4C] hover:border-[#F4601F] hover:text-[#B83E08]">
                          <IcLocationOn size={14} /> Mechanic in {n.name}
                        </Link>
                      </li>
                    ))}
                    <li>
                      <Link href="/blog#service-areas" className="inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-[13.5px] font-semibold text-[#1864C8] hover:underline">All service areas <IcChevronRight size={15} /></Link>
                    </li>
                  </ul>
                </section>
              )}
            </article>

            {/* ── Sidebar ── */}
            <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
              <nav aria-label="In this guide" className="mb-5 hidden rounded-2xl border border-[#E6ECF3] bg-white p-5 lg:block">
                <p className="text-[13px] font-semibold uppercase tracking-wide text-[#52667C]">In this guide</p>
                <ol className="mt-3 space-y-2 text-[14px] leading-snug">
                  {post.sections.map((s) => <li key={s.id}><a href={`#${s.id}`} className="text-[#0E2B4C] hover:text-[#B83E08]">{s.h2}</a></li>)}
                  <li><a href="#faq" className="text-[#0E2B4C] hover:text-[#B83E08]">Frequently asked questions</a></li>
                </ol>
              </nav>
              <div className="rounded-2xl bg-[linear-gradient(160deg,#0E2B4C,#15406F)] p-5 text-white">
                <p className="text-[18px] font-bold leading-snug">{city ? `Need a mechanic in ${city.name}?` : 'Need a mechanic?'}</p>
                <ul className="mt-3 space-y-2 text-[13.5px] text-[#D5E1EF]">
                  {['Verified, trained mechanics', 'Genuine parts with invoice', '30-day service warranty', 'Pay after service'].map((t) => (
                    <li key={t} className="flex items-center gap-2"><IcVerifiedUser size={16} className="shrink-0 text-[#7BD6A3]" /> {t}</li>
                  ))}
                </ul>
                <Link href={bookHref} className="mt-4 flex h-11 items-center justify-center gap-2 rounded-full bg-[#C94309] text-[14.5px] font-semibold text-white hover:bg-[#A93807] hover:text-white">
                  <IcBuild size={17} /> Book a Service
                </Link>
                <a href={PHONE_HREF} className="mt-2.5 flex h-11 items-center justify-center gap-2 rounded-full bg-white text-[14.5px] font-semibold text-[#0E2B4C] hover:bg-[#EEF2F7]">
                  <IcCall size={17} /> {PHONE}
                </a>
              </div>
            </aside>
          </div>

          {/* ── Related ── */}
          {related.length > 0 && (
            <section className="border-t border-[#E6ECF3] bg-white">
              <div className="mx-auto max-w-[1220px] px-[clamp(14px,3vw,24px)] py-10">
                <h2 className="flex items-center gap-3 text-[21px] font-bold sm:text-[24px]"><span aria-hidden className="h-[3px] w-6 rounded-full bg-[#F4601F]" />Related guides</h2>
                <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {related.map((r) => (
                    <li key={r.slug}>
                      <Link href={`/blog/${r.slug}`} className="flex h-full flex-col rounded-2xl border border-[#E6ECF3] bg-[#F9FBFE] p-4 transition-[border-color,box-shadow] hover:border-[#F4B48F] hover:shadow-[0_12px_28px_-18px_rgba(14,43,76,0.4)]">
                        <span className="text-[11.5px] font-semibold uppercase tracking-wide text-[#B83E08]">{r.category}</span>
                        <span className="mt-1.5 text-[15px] font-semibold leading-snug text-[#0E2B4C]">{r.title}</span>
                        <span className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-[#52667C]">{r.excerpt}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </div>
      </UserLayout>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const { getAllPosts } = await import('@/data/blog/posts')
  return { paths: getAllPosts().map((p) => ({ params: { slug: p.slug } })), fallback: false }
}

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const { getPost, getCards } = await import('@/data/blog/posts')
  const post = getPost(String(params?.slug))
  if (!post) return { notFound: true }
  return { props: { post, related: getCards(post.related) } }
}
