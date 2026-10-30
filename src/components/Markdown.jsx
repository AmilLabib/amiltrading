import { Link } from 'wouter'

// Tiny, safe markdown: **bold**, *italic*, ==highlight==, $TICKER links, lists, > quotes.
const INLINE = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|==[^=]+==|\$[A-Za-z]{2,6}\b)/g

function inline(text) {
  return text.split(INLINE).map((part, i) => {
    if (!part) return null
    if (part.startsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.startsWith('==')) return <mark key={i} className="highlight text-inherit bg-transparent">{part.slice(2, -2)}</mark>
    if (part.startsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>
    if (part.startsWith('$')) {
      const t = part.slice(1).toUpperCase()
      return (
        <Link key={i} href={`/saham/${t}`} className="font-sans text-[0.85em] font-semibold tracking-wide underline decoration-margin decoration-2 underline-offset-4 hover:decoration-ink">
          {t}
        </Link>
      )
    }
    return part
  })
}

function withBreaks(lines) {
  return lines.flatMap((l, i) => (i ? [<br key={`br${i}`} />, ...inline(l)] : inline(l)))
}

export default function Markdown({ text, className = 'prose-journal' }) {
  const blocks = []
  const lines = (text || '').replace(/\r/g, '').split('\n')
  let para = []
  let list = null

  const flush = () => {
    if (para.length) blocks.push(<p key={blocks.length}>{withBreaks(para)}</p>)
    if (list) {
      const Tag = list.ordered ? 'ol' : 'ul'
      blocks.push(<Tag key={blocks.length}>{list.items.map((it, i) => <li key={i}>{inline(it)}</li>)}</Tag>)
    }
    para = []
    list = null
  }

  for (const line of lines) {
    const bullet = line.match(/^\s*[-*•]\s+(.*)/)
    const ordered = line.match(/^\s*\d+[.)]\s+(.*)/)
    const quote = line.match(/^>\s?(.*)/)
    if (bullet || ordered) {
      if (para.length || (list && list.ordered !== Boolean(ordered))) flush()
      list ||= { ordered: Boolean(ordered), items: [] }
      list.items.push((bullet || ordered)[1])
    } else if (quote) {
      flush()
      blocks.push(<blockquote key={blocks.length}>{inline(quote[1])}</blockquote>)
    } else if (!line.trim()) {
      flush()
    } else {
      if (list) flush()
      para.push(line)
    }
  }
  flush()

  return <div className={className}>{blocks}</div>
}
