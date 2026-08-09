import { Helmet } from "react-helmet-async";

const SITE_NAME = "Milad Flow";
const SITE_URL = "https://miladflow.vercel.app";
const DEFAULT_TITLE =
  "Milad Flow — Event & Results Platform for Madrassa Milad-un-Nabi Festivals";
const DEFAULT_DESCRIPTION =
  "Run your Madrassa's Milad-un-Nabi festival end to end: registrations, live schedules, category results and public leaderboards, all in one platform built for madrassa committees.";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

export default function SeoHead({
  title,
  rawTitle,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  image = DEFAULT_IMAGE,
  type = "website",
  noIndex = false,
}) {
  const fullTitle = rawTitle || (title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE);
  const url = `${SITE_URL}${path === "/" ? "" : path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta
        name="robots"
        content={noIndex ? "noindex, nofollow" : "index, follow"}
      />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="en_IN" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
