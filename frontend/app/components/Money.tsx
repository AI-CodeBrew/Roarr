// app/components/Money.tsx
import { useMemo } from "react";
import { useLoaderData } from "react-router";

/** Decode HTML entities so escaped format strings from the API render as real HTML. */
function decodeHtmlEntities(str: string): string {
  const doc = new DOMParser().parseFromString(str, "text/html");
  return doc.documentElement.textContent ?? str;
}

export const Money = ({ amount }: { amount: string | number }) => {
  const { shopCurrencyDetails } = useLoaderData();
  const currencyFormat = useMemo(() => {
    return shopCurrencyDetails?.currencyFormats?.moneyFormat;
  }, [shopCurrencyDetails]);

  const formattedAmount = useMemo(() => {
    if (!currencyFormat || typeof currencyFormat !== "string") {
      return amount.toString();
    }
    // Format may be HTML with {{amount}} inside, and may be entity-escaped (e.g. &lt;span&gt;)
    const decodedFormat = decodeHtmlEntities(currencyFormat);
    return decodedFormat.replace(/\{\{amount\}\}/, amount.toString());
  }, [currencyFormat, amount]);

  // If the format contains HTML (raw tags or was entity-escaped), render as HTML.
  // Source is trusted (shop settings); do not use with user-supplied format strings.
  const hasHtml = useMemo(() => {
    if (typeof formattedAmount !== "string") return false;
    return (
      /<[^>]+>/.test(formattedAmount) ||
      /&lt;|&gt;|&amp;/.test(currencyFormat ?? "")
    );
  }, [formattedAmount, currencyFormat]);
  if (hasHtml) {
    const html = /<[^>]+>/.test(formattedAmount)
      ? formattedAmount
      : decodeHtmlEntities(formattedAmount);
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  }
  return <span>{formattedAmount}</span>;
};
