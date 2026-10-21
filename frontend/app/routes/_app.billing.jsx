import { redirect } from "react-router";

/** Legacy path: credit packs moved from `/billing` to `/credits`. */
export function loader() {
  return redirect("/credits");
}

export default function BillingRedirect() {
  return null;
}
