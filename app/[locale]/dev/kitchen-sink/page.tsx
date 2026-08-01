import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Barcode } from "@/components/brand/Barcode";
import { FiveMark } from "@/components/brand/FiveMark";
import { Grain } from "@/components/brand/Grain";
import { GoldBar, GoldText } from "@/components/brand/GoldText";
import { Halftone } from "@/components/brand/Halftone";
import { LogoMonogram } from "@/components/brand/LogoMonogram";
import { MaskEmblem } from "@/components/brand/MaskEmblem";
import { MetaStrip } from "@/components/brand/MetaStrip";
import { OrnamentBottom, OrnamentCorner, OrnamentCrown, OrnamentSide } from "@/components/brand/Ornaments";
import { PhotoPlaceholder } from "@/components/brand/PhotoPlaceholder";
import { RegCross, RegMarks } from "@/components/brand/RegMarks";
import { RuneDot } from "@/components/brand/RuneDot";
import { RunicBar, RunicLine, RunicVertical } from "@/components/brand/Rune";
import { Stamp } from "@/components/brand/Stamp";
import { Tape } from "@/components/brand/Tape";
import { TearHalo } from "@/components/brand/TearHalo";
import { Wordmark } from "@/components/brand/Wordmark";

/**
 * Regression surface for the whole brand-primitive port (Stage 2). Not
 * linked from any nav and excluded from production — a page a component
 * broke on is much cheaper to find here than on a real page later.
 */
export default function KitchenSinkPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div className="flex flex-col gap-16 bg-pitch px-8 py-12 text-bone">
      <header>
        <h1 className="font-display text-4xl uppercase">Kitchen Sink</h1>
        <p className="text-steel-text mt-2 font-mono text-sm">
          Every brand primitive, every prop combination that matters. Not a real page.
        </p>
      </header>

      <Section title="Wordmark">
        <Swatch label="default"><Wordmark width={200} /></Swatch>
        <Swatch label="gold"><Wordmark width={200} color="var(--color-gold)" /></Swatch>
        <Swatch label="shiny"><Wordmark width={200} shiny /></Swatch>
        <Swatch label="custom title"><Wordmark width={200} title="Custom accessible name" /></Swatch>
      </Section>

      <Section title="MaskEmblem">
        <Swatch label="default"><MaskEmblem size={100} /></Swatch>
        <Swatch label="ring"><MaskEmblem size={100} ring /></Swatch>
        <Swatch label="shiny"><MaskEmblem size={100} shiny /></Swatch>
        <Swatch label="titled (accessible)"><MaskEmblem size={100} title="Tears of God mask emblem" /></Swatch>
      </Section>

      <Section title="LogoMonogram">
        <Swatch label="default"><LogoMonogram size={80} /></Swatch>
        <Swatch label="inverted"><LogoMonogram size={80} bg="var(--color-bone)" fg="var(--color-pitch)" /></Swatch>
        <Swatch label="shiny"><LogoMonogram size={80} shiny /></Swatch>
      </Section>

      <Section title="TearHalo">
        <Swatch label="default"><TearHalo size={120} /></Swatch>
        <Swatch label="gold, thick stroke"><TearHalo size={120} color="var(--color-gold)" strokeW={2} /></Swatch>
      </Section>

      <Section title="FiveMark">
        <Swatch label="default"><FiveMark size={60} /></Swatch>
        <Swatch label="gold"><FiveMark size={60} color="var(--color-gold)" /></Swatch>
      </Section>

      <Section title="Grain / Halftone (overlay demo)">
        <Swatch label="grain 0.18 multiply">
          <div className="relative h-24 w-40 bg-ash">
            <Grain />
          </div>
        </Swatch>
        <Swatch label="grain 0.4 overlay">
          <div className="relative h-24 w-40 bg-ash">
            <Grain opacity={0.4} blend="overlay" />
          </div>
        </Swatch>
        <Swatch label="halftone">
          <div className="relative h-24 w-40 bg-bone">
            <Halftone />
          </div>
        </Swatch>
      </Section>

      <Section title="RegMarks / RegCross">
        <Swatch label="RegMarks (corners)">
          <div className="relative h-24 w-40 border border-steel">
            <RegMarks color="var(--color-gold)" />
          </div>
        </Swatch>
        <Swatch label="RegCross"><RegCross size={24} color="var(--color-gold)" /></Swatch>
      </Section>

      <Section title="MetaStrip">
        <Swatch label="default" wide>
          <MetaStrip left="TOG / IDENTITY / 01" right="LOGO SYSTEM — v1.0" />
        </Swatch>
        <Swatch label="custom color" wide>
          <MetaStrip left="CASTROP-RAUXEL" right="44575" color="var(--color-gold)" />
        </Swatch>
      </Section>

      <Section title="PhotoPlaceholder">
        <Swatch label="dark, 1:1">
          <PhotoPlaceholder label="JONAS" aspect="1 / 1" className="h-24 w-24" />
        </Swatch>
        <Swatch label="light, 3:4, rotated">
          <PhotoPlaceholder label="LIVE" aspect="3 / 4" dark={false} rotate={-4} className="h-32 w-24" />
        </Swatch>
      </Section>

      <Section title="Tape / Stamp">
        <Swatch label="Tape">
          <div className="relative h-16 w-32 bg-bone">
            <Tape top={10} left={10} />
          </div>
        </Swatch>
        <Swatch label="Stamp (on light — default color)">
          <div className="bg-bone p-4">
            <Stamp>Signed in Blood</Stamp>
          </div>
        </Swatch>
        <Swatch label="Stamp (on pitch — text-safe color)">
          <Stamp color="var(--color-blood-text)">Signed in Blood</Stamp>
        </Swatch>
      </Section>

      <Section title="Barcode (determinism check — both should be identical)">
        <Swatch label='seed="tog-001"'><Barcode seed="tog-001" color="var(--color-bone)" /></Swatch>
        <Swatch label='seed="tog-001" (again)'><Barcode seed="tog-001" color="var(--color-bone)" /></Swatch>
        <Swatch label='seed="tog-002" (different)'><Barcode seed="tog-002" color="var(--color-bone)" /></Swatch>
      </Section>

      <Section title="GoldText / GoldBar">
        <Swatch label="GoldText">
          <GoldText as="p" className="font-display text-3xl uppercase">
            Tears of God
          </GoldText>
        </Swatch>
        <Swatch label="GoldBar">
          <GoldBar className="px-4 py-2 font-display text-sm text-pitch uppercase">Gold Bar</GoldBar>
        </Swatch>
      </Section>

      <Section title="Runic alphabet">
        <Swatch label="RunicLine">
          <RunicLine size={20} color="var(--color-gold)">TEARS OF GOD</RunicLine>
        </Swatch>
        <Swatch label="RunicLine, gold shimmer">
          <RunicLine size={20} gold>TEARS OF GOD</RunicLine>
        </Swatch>
        <Swatch label="RunicVertical">
          <RunicVertical size={20} color="var(--color-gold)">TEARS</RunicVertical>
        </Swatch>
        <Swatch label="RunicBar">
          <div className="h-40">
            <RunicBar text="TEARS·OF·GOD" runeColor="var(--color-gold)" ruleColor="var(--color-gold)" />
          </div>
        </Swatch>
        <Swatch label="RuneDot"><RuneDot size={10} color="var(--color-gold)" /></Swatch>
      </Section>

      <Section title="Ornaments">
        <Swatch label="Corner"><OrnamentCorner size={100} color="var(--color-gold)" /></Swatch>
        <Swatch label="Bottom"><OrnamentBottom size={140} color="var(--color-gold)" /></Swatch>
        <Swatch label="Crown"><OrnamentCrown size={160} color="var(--color-gold)" /></Swatch>
        <Swatch label="Side"><OrnamentSide size={140} color="var(--color-gold)" /></Swatch>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-ash pt-6">
      <h2 className="font-display mb-4 text-xl uppercase">{title}</h2>
      <div className="flex flex-wrap items-start gap-8">{children}</div>
    </section>
  );
}

function Swatch({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={wide ? "w-full max-w-md" : undefined}>
      <div className="text-steel-text mb-2 font-mono text-xs uppercase">{label}</div>
      {children}
    </div>
  );
}
