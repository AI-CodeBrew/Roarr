import { onLCP, onCLS, onFCP, onTTFB } from "web-vitals";

export function reportWebVitals() {
  onLCP((metric) => {
    console.log("[Web Vitals] LCP:", metric.value / 1000);
    console.log("[Web Vitals] LCP", metric);
  }, { reportAllChanges: true });
  onCLS((metric) => {
    console.log("[Web Vitals] CLS:", metric.value);
    console.log("[Web Vitals] CLS", metric);
  }, { reportAllChanges: true });
  onFCP((metric) => {
    console.log("[Web Vitals] FCP:", metric.value / 1000);
    console.log("[Web Vitals] FCP", metric);
  }, { reportAllChanges: true });
  onTTFB((metric) => {
    console.log("[Web Vitals] TTFB:", metric.value / 1000);
    console.log("[Web Vitals] TTFB", metric);
  }, { reportAllChanges: true });
}
