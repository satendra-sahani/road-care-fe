'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Save, RefreshCw, Megaphone, Smartphone, CheckCircle2, Info } from 'lucide-react'

// Admin management for the customer app's Home popup — the promotional modal
// that appears once per session when a customer opens the app. Content AND
// design are edited here and delivered to the app via GET /api/common/config
// (AppConfig.homePopup). Saving PUTs only { homePopup } so the rest of the app
// config is never touched.

type Popup = {
  enabled: boolean
  title: string
  subtitle: string
  badge: string
  body: string
  emoji: string
  imageUrl: string
  ctaText: string
  ctaTarget: string
  secondaryText: string
  gradient: string[]
  accentColor: string
  showOnce: boolean
}

const DEFAULTS: Popup = {
  enabled: true,
  title: 'Cashback Festival',
  subtitle: 'is LIVE · कैशबैक फेस्टिवल',
  badge: 'Real cashback on every order',
  body: 'Refer friends & earn ₹100 each — real cash, withdrawable to any UPI.',
  emoji: '🎉',
  imageUrl: '',
  ctaText: 'Claim & Explore',
  ctaTarget: 'Cashback',
  secondaryText: 'Maybe later',
  gradient: ['#FF4D8D', '#FF6B35', '#8C5CFF'],
  accentColor: '',
  showOnce: true,
}

const CTA_TARGETS = ['Cashback', 'Shop', 'Subscription', 'Tracker']

export function HomePopupManagement() {
  const [cfg, setCfg] = useState<Popup>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const { configAPI } = await import('@/services/api')
        const res = await configAPI.getConfig()
        const hp = res.data?.data?.homePopup
        if (res.data?.success && hp) {
          setCfg({
            ...DEFAULTS,
            ...hp,
            gradient: Array.isArray(hp.gradient) && hp.gradient.length >= 2 ? hp.gradient : DEFAULTS.gradient,
          })
        }
      } catch (e) {
        console.error('Load home popup failed:', e)
        setError('Could not load the current popup. Showing defaults.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const set = <K extends keyof Popup>(k: K, v: Popup[K]) => {
    setCfg((p) => ({ ...p, [k]: v }))
    setSaved(false)
  }
  const setGrad = (i: number, v: string) => {
    const g = [...(cfg.gradient?.length ? cfg.gradient : DEFAULTS.gradient)]
    g[i] = v
    set('gradient', g)
  }

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const { configAPI } = await import('@/services/api')
      const res = await configAPI.updateConfig({ homePopup: cfg })
      if (res.data?.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3500)
      } else {
        setError(res.data?.message || 'Save failed')
      }
    } catch (e: any) {
      setError(e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const accent = cfg.accentColor || '#F59E0B'
  const grad = cfg.gradient?.length >= 2 ? cfg.gradient : DEFAULTS.gradient

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-pink-50">
            <Megaphone className="h-5 w-5 text-pink-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1A1D29] tracking-tight">Home Popup</h1>
            <p className="text-[#6B7280] text-sm mt-0.5">The promotional modal customers see when they open the app.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
              <CheckCircle2 className="h-4 w-4" /> Saved
            </span>
          )}
          <Button onClick={save} disabled={saving || loading} className="bg-[#1B3B6F] hover:bg-[#0F2545]">
            {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {saving ? 'Saving...' : 'Save Popup'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <Info className="h-4 w-4 mt-0.5 shrink-0" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Editor ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Enable */}
          <Card className="border border-gray-100 shadow-sm rounded-2xl">
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <Label className="font-medium">Show this popup in the app</Label>
                <p className="text-sm text-[#6B7280] mt-0.5">Turn off to hide the popup entirely for all customers.</p>
              </div>
              <Switch checked={cfg.enabled} onCheckedChange={(v) => set('enabled', v)} />
            </CardContent>
          </Card>

          {/* Content */}
          <Card className="border border-gray-100 shadow-sm rounded-2xl">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-[#1A1D29]">Content</CardTitle>
              <CardDescription>Text shown inside the popup</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hpTitle">Title</Label>
                  <Input id="hpTitle" value={cfg.title} onChange={(e) => set('title', e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="hpSubtitle">Subtitle</Label>
                  <Input id="hpSubtitle" value={cfg.subtitle} onChange={(e) => set('subtitle', e.target.value)} />
                </div>
              </div>
              <div>
                <Label htmlFor="hpBadge">Badge / pill text</Label>
                <Input id="hpBadge" value={cfg.badge} onChange={(e) => set('badge', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="hpBody">Body</Label>
                <textarea
                  id="hpBody"
                  className="w-full min-h-[90px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={cfg.body}
                  onChange={(e) => set('body', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="hpEmoji">Emoji</Label>
                  <Input id="hpEmoji" maxLength={4} value={cfg.emoji} onChange={(e) => set('emoji', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="hpImage">Image URL (optional — replaces the emoji)</Label>
                  <Input id="hpImage" placeholder="https://..." value={cfg.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action */}
          <Card className="border border-gray-100 shadow-sm rounded-2xl">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-[#1A1D29]">Button & behaviour</CardTitle>
              <CardDescription>What the buttons say and where they go</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hpCtaText">Primary button text</Label>
                  <Input id="hpCtaText" value={cfg.ctaText} onChange={(e) => set('ctaText', e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="hpCtaTarget">Button action</Label>
                  <Input id="hpCtaTarget" list="cta-targets" placeholder="Cashback" value={cfg.ctaTarget} onChange={(e) => set('ctaTarget', e.target.value)} />
                  <datalist id="cta-targets">
                    {CTA_TARGETS.map((t) => <option key={t} value={t} />)}
                  </datalist>
                  <p className="mt-1 text-xs text-[#6B7280]">Screen name ({CTA_TARGETS.join(', ')}) or an https:// link.</p>
                </div>
              </div>
              <div>
                <Label htmlFor="hpSecondary">Secondary (dismiss) text</Label>
                <Input id="hpSecondary" value={cfg.secondaryText} onChange={(e) => set('secondaryText', e.target.value)} />
              </div>
              <div className="flex items-center justify-between pt-1">
                <div>
                  <Label>Show once per session</Label>
                  <p className="text-sm text-[#6B7280]">Off = show on every Home visit.</p>
                </div>
                <Switch checked={cfg.showOnce !== false} onCheckedChange={(v) => set('showOnce', v)} />
              </div>
            </CardContent>
          </Card>

          {/* Design */}
          <Card className="border border-gray-100 shadow-sm rounded-2xl">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-[#1A1D29]">Design</CardTitle>
              <CardDescription>Header gradient and button colour</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
              <div>
                <Label>Header gradient</Label>
                <div className="mt-1 flex items-center gap-2">
                  {[0, 1, 2].map((i) => (
                    <input
                      key={i}
                      type="color"
                      value={grad[i] || '#FF4D8D'}
                      onChange={(e) => setGrad(i, e.target.value)}
                      className="h-9 w-12 rounded border border-gray-200 bg-white p-0.5"
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label>Button colour (blank = app default)</Label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={cfg.accentColor || '#F59E0B'}
                    onChange={(e) => set('accentColor', e.target.value)}
                    className="h-9 w-12 rounded border border-gray-200 bg-white p-0.5"
                  />
                  <Button variant="outline" size="sm" onClick={() => set('accentColor', '')}>Reset</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Live preview ── */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-6">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#6B7280]">
              <Smartphone className="h-4 w-4" /> Live preview
            </div>
            <div className="rounded-[28px] border-[6px] border-slate-900 bg-slate-900 p-2 shadow-xl">
              <div className="rounded-[20px] bg-slate-100 p-4">
                {cfg.enabled ? (
                  <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-3xl bg-white shadow-2xl">
                    <div className="relative p-6 text-center" style={{ background: `linear-gradient(135deg, ${grad.join(', ')})` }}>
                      <div className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-white/25 text-white text-xs">✕</div>
                      {cfg.imageUrl
                        ? <img src={cfg.imageUrl} alt="" className="mx-auto h-16 w-full max-w-[220px] rounded-lg object-cover" />
                        : <div className="text-5xl leading-none">{cfg.emoji || '🎉'}</div>}
                      <div className="mt-2 text-xl font-extrabold text-white">{cfg.title || 'Title'}</div>
                      {cfg.subtitle && <div className="text-xs font-bold text-white/90">{cfg.subtitle}</div>}
                    </div>
                    <div className="p-5 text-center">
                      {cfg.badge && <div className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{cfg.badge}</div>}
                      {cfg.body && <p className="mt-2 text-sm text-gray-600">{cfg.body}</p>}
                      <div className="mt-4 rounded-xl py-2.5 text-sm font-bold text-white shadow" style={{ backgroundColor: accent }}>{cfg.ctaText || 'Claim'}</div>
                      {cfg.secondaryText && <div className="mt-2 text-xs font-semibold text-gray-400">{cfg.secondaryText}</div>}
                    </div>
                  </div>
                ) : (
                  <div className="py-16 text-center text-sm font-medium text-slate-400">
                    Popup is turned <span className="font-bold text-slate-500">OFF</span>.<br />Customers won&apos;t see it.
                  </div>
                )}
              </div>
            </div>
            <p className="mt-3 text-xs text-[#6B7280] leading-relaxed">
              Changes go live in the app after you press <span className="font-semibold">Save Popup</span>. The app fetches this on launch.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePopupManagement
