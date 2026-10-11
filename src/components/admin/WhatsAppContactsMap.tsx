'use client'

// WhatsApp contacts → Map View.
//
// A contact has the name of a city (or a village), not a position — so this is a map of cities:
// a bubble on each one with how many of the contacts the filters above show are there. A city is
// put where the app's own garages of that name are; the other names are looked up
// (OpenStreetMap, one a second as it asks; Google for a name it does not have) and
// remembered in this browser.
// The city marked here IS the list's city filter: picking one narrows the list and the
// "Send Template" button to it.
import { useEffect, useMemo, useRef, useState } from 'react'
import { List, Loader2, MapPin, MapPinOff, RefreshCw, Search, Send, X } from 'lucide-react'
import { GarageMap, type MapPin as Pin } from '@/components/manager/GarageMap'
import { cityArea, findCityPoint, kmBetween, knownCityPoints, type LatLng, type MapArea } from '@/lib/cityAreas'
import { adminWhatsappContactsAPI, type WaContactFilter } from '@/services/api'
import { NAVY, ORANGE, TYPES } from './WhatsAppContactsParts'

type CityRow = { city: string; total: number; optedIn: number; types: Record<string, number>; lat?: number; lng?: number }
type Counts = { total: number; noCity: number; cities: CityRow[] }

const GREEN = '#16A34A', GREY = '#94A3B8'
/** names asked of OpenStreetMap in one sitting; more than that wait for the next visit */
const MAX_LOOKUPS = 200
/** cities this far from where most contacts are do not decide the first view of the map */
const FRAME_KM = 300
/** the map is as tall as the window allows, so it is seen whole with the filters above it */
const TALL = 'clamp(420px, calc(100vh - 300px), 640px)'
/** the place of a city's name is taken over the middle of the app's garages there when it is this near them */
const OWN_KM = 40
const key = (c: string) => c.replace(/\s+/g, ' ').trim().toLowerCase()
/** the middle of the app's own garages of that city, when it has any */
const own = (c: CityRow): LatLng | null => (c.lat != null && c.lng != null ? { lat: c.lat, lng: c.lng } : null)
const num = (n: number) => n.toLocaleString('en-IN')
const short = (n: number) => (n >= 10000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(n))
const people = (n: number) => `${num(n)} contact${n === 1 ? '' : 's'}`
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function WhatsAppContactsMap({ query, city, onCity, onShowList, onSend }: {
  /** the list's filters; its city is the one marked on the map */
  query: WaContactFilter
  /** the city chosen in the filters ('' = none) */
  city: string
  onCity: (city: string) => void
  onShowList: () => void
  /** send a template to everybody the filters show */
  onSend: () => void
}) {
  const [data, setData] = useState<Counts | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [again, setAgain] = useState(0)
  /** where the names that the app has no garage for were found (null = not found) */
  const [spots, setSpots] = useState<Record<string, LatLng | null>>({})
  const spotsNow = useRef(spots)
  spotsNow.current = spots
  const [placing, setPlacing] = useState<{ done: number; of: number } | null>(null)
  const [offline, setOffline] = useState(false)
  const [area, setArea] = useState<MapArea | null>(null)
  const [q, setQ] = useState('')
  const [frame, setFrame] = useState(0)
  const [everything, setEverything] = useState(false)

  // the map shows every city, so the city filter is not sent
  const others = useMemo(() => { const rest = { ...query }; delete rest.city; return rest }, [query])
  const othersKey = JSON.stringify(others)

  useEffect(() => {
    let off = false
    setLoading(true); setFailed(false)
    adminWhatsappContactsAPI.cityCounts(others)
      .then((r) => { if (!off) { if (r.data?.success) setData(r.data.data); else setFailed(true) } })
      .catch(() => { if (!off) setFailed(true) })
      .finally(() => { if (!off) setLoading(false) })
    return () => { off = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [othersKey, again])

  // Put the names on the map: what this browser knows at once, the rest asked one by one.
  // A city the app has garages in is shown there straight away and asked about all the same —
  // the middle of a few garages is not the middle of the town.
  useEffect(() => {
    if (!data) return
    const need = data.cities.filter((c) => !(key(c.city) in spotsNow.current))
    if (!need.length) { setPlacing(null); return }
    const known = knownCityPoints(need.map((c) => c.city))
    if (Object.keys(known).length) setSpots((s) => ({ ...s, ...known }))
    const ask = need.filter((c) => !(key(c.city) in known)).slice(0, MAX_LOOKUPS)
    if (!ask.length) { setPlacing(null); return }
    let off = false
    ;(async () => {
      const have = { ...spotsNow.current, ...known }
      // where most of the contacts are: a village's name is matched to the one near them
      let hubs: LatLng[] = data.cities.map((c) => own(c) || have[key(c.city)]).filter((p): p is LatLng => !!p).slice(0, 3)
      setPlacing({ done: 0, of: ask.length }); setOffline(false)
      let misses = 0
      for (let i = 0; i < ask.length && !off; i++) {
        const name = ask[i].city, mine = own(ask[i])
        const hit = await findCityPoint(name, mine ? [mine] : hubs)
        if (off) return
        if (hit === undefined) { if (++misses >= 3) { setOffline(true); break } } else {
          misses = 0
          setSpots((s) => ({ ...s, [key(name)]: hit }))
          if (!hubs.length && hit) hubs = [hit]
        }
        setPlacing({ done: i + 1, of: ask.length })
        await sleep(1100)
      }
      if (!off) setPlacing(null)
    })()
    return () => { off = true }
  }, [data])

  const cities = data?.cities || []
  /** where a city is: the place of that name — which, for a city the app has garages in, must be near them */
  const at = (c: CityRow): LatLng | null => {
    const mine = own(c), found = spots[key(c.city)] || null
    if (!mine) return found
    return found && kmBetween(found, mine) <= OWN_KM ? found : mine
  }
  const sel = key(city)
  const chosen = sel ? cities.find((c) => key(c.city) === sel) || null : null
  const chosenAt = chosen ? at(chosen) : null

  const pins: Pin[] = useMemo(() => {
    const max = Math.max(1, ...cities.map((c) => c.total))
    const out: Pin[] = []
    for (const c of cities) {
      const p = at(c)
      if (!p) continue
      const size = Math.round(26 + 34 * Math.min(1, Math.log10(1 + c.total) / Math.max(2, Math.log10(1 + max))))
      out.push({ id: key(c.city), lat: p.lat, lng: p.lng, text: short(c.total), size, color: key(c.city) === sel ? ORANGE : c.optedIn ? GREEN : GREY, title: `${c.city} — ${people(c.total)}` })
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, spots, sel])

  // the first view: the cities around where most contacts are (a namesake far away does not shrink the map to a dot)
  const hub = pins[0]
  const nearPins = useMemo(() => (hub ? pins.filter((p) => kmBetween(p, hub) <= FRAME_KM) : []), [pins, hub])
  const far = pins.length - nearPins.length

  // the outline of the chosen city (or a ring round it when the map has none)
  useEffect(() => {
    setArea(null)
    if (!chosen || !chosenAt) return
    let off = false
    cityArea(chosen.city, ORANGE, [chosenAt], 'wa').then((a) => { if (!off) setArea(a) }).catch(() => { if (!off) setArea(null) })
    return () => { off = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosen?.city, chosenAt?.lat, chosenAt?.lng])

  const pick = (name: string) => { onCity(key(name) === sel ? '' : name); if (key(name) === sel) setFrame((n) => n + 1) }
  const clear = () => { onCity(''); setFrame((n) => n + 1) }

  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const shown = words.length ? cities.filter((c) => words.every((w) => c.city.toLowerCase().includes(w))) : cities
  const unplaced = cities.filter((c) => !at(c) && key(c.city) in spots)
  const typeBits = (c: CityRow) => TYPES.filter((t) => c.types[t.value]).map((t) => `${t.label}${c.types[t.value] === 1 ? '' : 's'} ${num(c.types[t.value])}`)

  return (
    <section className="overflow-hidden rounded-2xl border border-[#E8EDF3] bg-white shadow-sm" data-contacts-map data-map-cities={data ? cities.length : undefined} data-map-placed={pins.length} data-map-placing={placing ? `${placing.done}/${placing.of}` : undefined}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EEF2F6] px-4 py-3">
        <div>
          <h2 className="text-[15px] font-extrabold text-[#0F172A]">Contacts by city</h2>
          <p className="text-[12.5px] text-[#64748B]" data-map-summary>
            {!data ? 'Counting…' : <>{people(data.total)} in {num(cities.length)} {cities.length === 1 ? 'city' : 'cities'}{data.noCity ? <> · {num(data.noCity)} without a city</> : null}{pins.length < cities.length && !placing ? <> · {num(cities.length - pins.length)} not on the map</> : null}</>}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[12.5px] font-bold">
          {placing && <span className="flex items-center gap-1.5 font-semibold text-[#64748B]" data-map-progress><Loader2 className="h-3.5 w-3.5 animate-spin" />Placing cities on the map… {placing.done} of {placing.of}</span>}
          {offline && !placing && <span className="font-semibold text-[#B45309]">The map service did not answer — some cities are not placed yet.</span>}
          {sel
            ? <button type="button" data-map-all onClick={clear} className="rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-[#0F172A] hover:bg-[#F8FAFC]">Show all cities</button>
            : far > 0 && <button type="button" data-map-far onClick={() => setEverything((v) => !v)} className="rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-[#0F172A] hover:bg-[#F8FAFC]">{everything ? 'Back to the main area' : `Show all (${far} far away)`}</button>}
        </div>
      </header>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="relative" style={{ height: TALL }}>
          <GarageMap className="h-full w-full" pins={pins} selectedId={sel || null} onSelect={(id) => { const c = id && cities.find((x) => key(x.city) === id); if (c) pick(c.city) }}
            areas={area ? [area] : undefined} fitAreasOnly fitKey={`${othersKey}|${frame}|${everything ? 'all' : 'near'}|${pins.length ? 1 : 0}`} fitPoints={everything ? undefined : nearPins} />
          <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-x-3 gap-y-1 rounded-lg bg-white/95 px-3 py-1.5 text-[11.5px] font-semibold text-[#334155] shadow">
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: GREEN }} />Contacts in a city</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: ORANGE }} />Chosen</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: GREY }} />All opted out</span>
          </div>
          {loading && <div className="absolute inset-x-0 bottom-3 flex justify-center"><span className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#334155] shadow"><Loader2 className="h-3.5 w-3.5 animate-spin" />Counting contacts…</span></div>}
        </div>

        <aside className="flex flex-col border-t border-[#EEF2F6] lg:border-l lg:border-t-0" style={{ maxHeight: TALL }}>
          {failed && (
            <div className="p-4 text-[13px] text-[#B91C1C]">Could not load the numbers for the map.
              <button type="button" onClick={() => setAgain((n) => n + 1)} className="ml-2 inline-flex items-center gap-1 font-bold text-[#2563EB]"><RefreshCw className="h-3.5 w-3.5" />Try again</button>
            </div>
          )}

          {sel && (
            <div className="border-b border-[#EEF2F6] bg-[#FFF7F3] p-4" data-city-card>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <b className="block truncate text-[16px] font-extrabold text-[#0F172A]">{chosen?.city || city}</b>
                  <span className="text-[12.5px] text-[#475569]" data-city-count>{chosen ? <>{people(chosen.total)} · {num(chosen.optedIn)} opted in{chosen.total - chosen.optedIn ? <> · {num(chosen.total - chosen.optedIn)} opted out</> : null}</> : 'No contact here with these filters'}</span>
                </div>
                <button type="button" aria-label="Clear the city" onClick={clear} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#64748B] hover:bg-white"><X className="h-4 w-4" /></button>
              </div>
              {chosen && typeBits(chosen).length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{typeBits(chosen).map((t) => <span key={t} className="rounded-md bg-white px-2 py-0.5 text-[11.5px] font-semibold text-[#334155] ring-1 ring-[#E2E8F0]">{t}</span>)}</div>}
              {chosen && !chosenAt && <p className="mt-2 flex items-start gap-1.5 text-[12px] text-[#92400E]"><MapPinOff className="mt-0.5 h-3.5 w-3.5 shrink-0" />{placing ? 'Still being placed on the map…' : 'This name was not found on the map — the contacts are counted here all the same.'}</p>}
              {chosen && (
                <div className="mt-3 flex gap-2">
                  <button type="button" data-city-list onClick={onShowList} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#0F172A] bg-white text-[12.5px] font-bold text-[#0F172A] hover:bg-[#F8FAFC]"><List className="h-3.5 w-3.5" />View contacts</button>
                  <button type="button" data-city-send disabled={!chosen.optedIn} title={chosen.optedIn ? `Send a template to the ${people(chosen.optedIn)} here who are opted in` : 'Everybody here is opted out'} onClick={onSend} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-[12.5px] font-bold text-white disabled:opacity-50" style={{ background: NAVY }}><Send className="h-3.5 w-3.5" />Send Template</button>
                </div>
              )}
            </div>
          )}

          {cities.length > 8 && (
            <div className="flex items-center gap-2 border-b border-[#EEF2F6] px-3">
              <Search className="h-4 w-4 shrink-0 text-[#94A3B8]" />
              <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search cities on the map" placeholder={`Search ${num(cities.length)} cities…`} className="h-10 min-w-0 flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-[#94A3B8]" />
              {q && <button type="button" aria-label="Clear the search" onClick={() => setQ('')} className="text-[#94A3B8]"><X className="h-4 w-4" /></button>}
            </div>
          )}

          <ul className="min-h-0 flex-1 overflow-y-auto py-1" data-city-list-rows>
            {!loading && data && cities.length === 0 && <li className="px-4 py-8 text-center text-[13px] text-[#64748B]">{data.total ? 'None of these contacts has a city.' : 'No contact matches these filters.'}</li>}
            {cities.length > 0 && shown.length === 0 && <li className="px-4 py-6 text-center text-[13px] text-[#94A3B8]">No city matches “{q}”</li>}
            {shown.map((c) => {
              const on = key(c.city) === sel, placed = !!at(c)
              return (
                <li key={key(c.city)}>
                  <button type="button" data-city-row={key(c.city)} aria-pressed={on} onClick={() => pick(c.city)} title={placed ? undefined : 'Not found on the map'}
                    className={`flex w-full items-center gap-2.5 px-4 py-2 text-left text-[13.5px] ${on ? 'bg-[#FFF1EA] font-bold text-[#0F172A]' : 'text-[#1F2937] hover:bg-[#F8FAFC]'}`}>
                    {placed ? <MapPin className="h-4 w-4 shrink-0" style={{ color: on ? ORANGE : c.optedIn ? GREEN : GREY }} /> : <MapPinOff className="h-4 w-4 shrink-0 text-[#CBD5E1]" />}
                    <span className="min-w-0 flex-1 truncate">{c.city}</span>
                    <span className="shrink-0 tabular-nums text-[12.5px] font-bold text-[#475569]">{num(c.total)}</span>
                  </button>
                </li>
              )
            })}
          </ul>

          {data && (data.noCity > 0 || unplaced.length > 0) && !placing && (
            <p className="border-t border-[#EEF2F6] px-4 py-2.5 text-[12px] leading-snug text-[#64748B]" data-map-note>
              {data.noCity > 0 && <>{people(data.noCity)} {data.noCity === 1 ? 'has' : 'have'} no city, so {data.noCity === 1 ? 'is' : 'are'} not on the map. </>}
              {unplaced.length > 0 && <>{unplaced.length === 1 ? 'One name was' : `${num(unplaced.length)} names were`} not found on the map (a spelling, or a small place) — still in the list above.</>}
            </p>
          )}
        </aside>
      </div>
    </section>
  )
}
