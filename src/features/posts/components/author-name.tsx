import { Link } from "@/lib/i18n/navigation";

/**
 * Author label for a post or comment.
 *
 * Admins are hidden from `profiles_public`, so their rows arrive without a name.
 * Those render as plain text — a `/persona/<id>` link would 404 — and the caller
 * passes the platform label as `name`.
 */
export function AuthorName({
  name,
  href,
  className,
}: {
  name: string;
  href?: string;
  className: string;
}) {
  if (!href) {
    return <span className={className}>{name}</span>;
  }

  return (
    <Link href={href} className={className}>
      {name}
    </Link>
  );
}
