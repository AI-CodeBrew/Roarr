import { Modal } from "@shopify/polaris";
import {
  Blocks,
  CircleCheck,
  CircleDot,
  CircleHelp,
  Columns2,
  ExternalLink,
  FileText,
  Grid2x2,
  Heading,
  Heart,
  Image,
  LayoutGrid,
  ListCollapse,
  Package,
  Puzzle,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Table2,
  TrendingUp,
  Truck,
} from "lucide-react";
import { PrimaryButton, SecondaryButton, StatusPill } from "../../components/RoarrUI.jsx";

/** Icons for the block handles returned by `/api/app-blocks-status`. */
const BLOCK_ICONS = {
  "buy-now-button": ShoppingCart,
  "product-details": FileText,
  "frequently-bought": ShoppingBag,
  bundle: Package,
  "comparison-table": Table2,
  "bento-grid": LayoutGrid,
  accordion: ListCollapse,
  "image-with-text": Image,
  "four-blocks": Grid2x2,
  "circular-feature-ring": CircleDot,
  "before-after": Columns2,
  "delivery-estimator": Truck,
  "heading-subheading": Heading,
  "impact-stat": TrendingUp,
  faq: CircleHelp,
  "loved-by-everyone": Heart,
};

/**
 * Polaris Modal (focus trap, Esc, scroll lock) with its grey header hidden and a Roarr-styled
 * header, body and footer drawn inside. Polaris keeps rendering its close button top-right.
 */
function DialogShell({ open, onClose, icon: IconComponent, title, subtitle, children, actions }) {
  return (
    <Modal open={open} onClose={onClose} title={title} titleHidden>
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-3 pr-10">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-[#eef3ff] to-[#e1e9ff] text-[#1e40af] ring-1 ring-inset ring-blue-200">
            <IconComponent size={20} aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="m-0 text-lg font-bold leading-tight tracking-tight text-slate-900">
              {title}
            </h2>
            {subtitle ? <p className="m-0 mt-0.5 text-[13px] text-slate-500">{subtitle}</p> : null}
          </div>
        </div>
        <div className="mt-5">{children}</div>
      </div>
      <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3 sm:px-6">
        {actions}
      </div>
    </Modal>
  );
}

function BlockTile({ block }) {
  const IconComponent = BLOCK_ICONS[block.handle] || Blocks;
  return (
    <li className="flex min-w-0 items-center gap-3 rounded-xl bg-white p-2.5 ring-1 ring-slate-200/80">
      <span
        className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg ${
          block.enabled ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-[#1e40af]"
        }`}
      >
        <IconComponent size={17} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="m-0 text-[13px] font-semibold leading-snug text-slate-900">{block.name}</p>
        <p className="m-0 text-xs text-slate-500">
          {block.enabled
            ? `In live theme${block.count > 1 ? ` · ${block.count} times` : ""}`
            : "Not added yet"}
        </p>
      </div>
      {block.enabled ? <StatusPill tone="success">Added</StatusPill> : null}
    </li>
  );
}

/**
 * Lists every Roarr app block and whether the live theme uses it.
 * `status` is the `/api/app-blocks-status` payload, or null while it loads.
 */
export function AppBlocksDialog({ open, onClose, status, onOpenThemeEditor }) {
  const loading = status === null;
  const blocks = status?.blocks || [];
  // Added blocks first; the sort is stable so the API order holds within each group.
  const sortedBlocks = [...blocks].sort((a, b) => Number(b.enabled) - Number(a.enabled));
  const addedCount = blocks.filter((block) => block.enabled).length;
  const percent = blocks.length ? Math.round((addedCount / blocks.length) * 100) : 0;

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      icon={Blocks}
      title="App blocks"
      subtitle="Roarr sections you can place anywhere in your theme."
      actions={
        <>
          <SecondaryButton size="sm" onClick={onClose}>
            Close
          </SecondaryButton>
          <PrimaryButton size="sm" onClick={onOpenThemeEditor}>
            Open theme editor
            <ExternalLink size={15} />
          </PrimaryButton>
        </>
      }
    >
      <div className="rounded-2xl bg-gradient-to-br from-[#f6f8ff] via-[#eef3ff] to-[#e1e9ff] p-4 ring-1 ring-blue-100">
        {loading ? (
          <p className="m-0 animate-pulse text-sm font-medium text-slate-500">Checking your theme…</p>
        ) : (
          <p className="m-0 text-sm text-slate-600">
            <span className="mr-1 text-2xl font-bold tabular-nums text-slate-900">{addedCount}</span>
            of {blocks.length} blocks in your live theme
          </p>
        )}
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/90">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#1e40af] via-[#4f46e5] to-[#7c3aed] transition-[width] duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="m-0 mt-3 flex gap-2 text-xs leading-relaxed text-slate-600">
          <Sparkles size={14} className="mt-0.5 flex-none text-[#4f46e5]" aria-hidden />
          Roarr adds the blocks it needs automatically when you generate a product page or full
          store. You can also add any of them by hand in the theme editor.
        </p>
      </div>

      <div className="-mx-1 mt-3 max-h-[44vh] overflow-y-auto p-1">
        {loading ? (
          <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2" aria-hidden>
            {Array.from({ length: 6 }, (_, index) => (
              <li key={index} className="h-[58px] animate-pulse rounded-xl bg-slate-100" />
            ))}
          </ul>
        ) : sortedBlocks.length ? (
          <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
            {sortedBlocks.map((block) => (
              <BlockTile key={block.handle} block={block} />
            ))}
          </ul>
        ) : (
          <p className="m-0 rounded-xl bg-slate-50 p-4 text-center text-[13px] text-slate-500">
            Couldn&apos;t load your app blocks right now. Close this and use Recheck on the
            dashboard.
          </p>
        )}
      </div>
    </DialogShell>
  );
}

/** Theme extension (app embed) status; the embed is always treated as on. */
export function AppEmbedDialog({ open, onClose, error, onOpenThemeEditor }) {
  return (
    <DialogShell
      open={open}
      onClose={onClose}
      icon={Puzzle}
      title="Theme extension"
      subtitle="Roarr Theme Extension app embed"
      actions={
        <>
          <SecondaryButton size="sm" onClick={onClose}>
            Close
          </SecondaryButton>
          <PrimaryButton size="sm" onClick={onOpenThemeEditor}>
            Open theme editor
            <ExternalLink size={15} />
          </PrimaryButton>
        </>
      }
    >
      <div className="flex items-start gap-3 rounded-2xl bg-emerald-50/70 p-4 ring-1 ring-emerald-100">
        <CircleCheck size={20} className="mt-0.5 flex-none text-emerald-600" aria-hidden />
        <div className="min-w-0">
          <p className="m-0 text-sm font-semibold text-emerald-900">Enabled in your live theme</p>
          <p className="m-0 mt-0.5 text-[13px] leading-relaxed text-emerald-800/80">
            You can still open the theme editor if you need to adjust embed settings.
          </p>
        </div>
      </div>
      {error ? <p className="m-0 mt-3 text-[13px] text-red-600">{error}</p> : null}
    </DialogShell>
  );
}
