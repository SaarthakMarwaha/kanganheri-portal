import React from "react";

export interface JsonLdPlace {
  type: "AdministrativeArea";
  name: string;
  alternateName?: string;
  description: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  containedInPlace?: string;
}

export interface JsonLdLocalBusiness {
  type: "LocalBusiness";
  name: string;
  description?: string;
  telephone: string;
  address: {
    streetAddress?: string;
    addressLocality: string;
    postalCode: string;
    addressCountry: string;
  };
  image?: string;
}

export interface JsonLdGovernmentService {
  type: "GovernmentService";
  name: string;
  serviceType: string;
  provider: {
    name: string;
    telephone: string;
    areaServed: string;
  };
}

export interface JsonLdBreadcrumb {
  type: "BreadcrumbList";
  itemListElement: Array<{
    position: number;
    name: string;
    item: string;
  }>;
}

export type JsonLdSchema =
  | JsonLdPlace
  | JsonLdLocalBusiness
  | JsonLdGovernmentService
  | JsonLdBreadcrumb
  | Record<string, unknown>;

interface JsonLdProps {
  data: JsonLdSchema;
}

/**
 * Reusable JSON-LD schema component for SEO rich snippets.
 * Renders a strict application/ld+json script tag safe against XSS injection.
 */
export function JsonLd({ data }: JsonLdProps) {
  // Build structured schema markup
  let schemaContent: Record<string, unknown>;

  if (typeof data === "object" && data !== null && "type" in data) {
    const d = data as JsonLdSchema;
    if ("type" in d && d.type === "AdministrativeArea") {
      const place = d as JsonLdPlace;
      schemaContent = {
        "@context": "https://schema.org",
        "@type": "AdministrativeArea",
        name: place.name,
        alternateName: place.alternateName,
        description: place.description,
        address: {
          "@type": "PostalAddress",
          addressLocality: "Kanganheri",
          addressRegion: "Delhi",
          postalCode: place.postalCode,
          addressCountry: "IN",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: place.latitude,
          longitude: place.longitude,
        },
        containedInPlace: {
          "@type": "AdministrativeArea",
          name: place.containedInPlace ?? "Najafgarh Tehsil, South West Delhi",
        },
      };
    } else if ("type" in d && d.type === "LocalBusiness") {
      const biz = d as JsonLdLocalBusiness;
      schemaContent = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: biz.name,
        description: biz.description,
        telephone: biz.telephone,
        image: biz.image,
        address: {
          "@type": "PostalAddress",
          streetAddress: biz.address.streetAddress,
          addressLocality: biz.address.addressLocality,
          postalCode: biz.address.postalCode,
          addressCountry: biz.address.addressCountry,
        },
      };
    } else if ("type" in d && d.type === "GovernmentService") {
      const gov = d as JsonLdGovernmentService;
      schemaContent = {
        "@context": "https://schema.org",
        "@type": "GovernmentService",
        name: gov.name,
        serviceType: gov.serviceType,
        provider: {
          "@type": "GovernmentOrganization",
          name: gov.provider.name,
          telephone: gov.provider.telephone,
          areaServed: gov.provider.areaServed,
        },
      };
    } else if ("type" in d && d.type === "BreadcrumbList") {
      const crumbs = d as JsonLdBreadcrumb;
      schemaContent = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: crumbs.itemListElement.map((item) => ({
          "@type": "ListItem",
          position: item.position,
          name: item.name,
          item: item.item,
        })),
      };
    } else {
      schemaContent = {
        "@context": "https://schema.org",
        ...data,
      };
    }
  } else {
    schemaContent = {
      "@context": "https://schema.org",
      ...data,
    };
  }

  // Prevent script breakout attacks by escaping HTML tags in JSON string
  const jsonString = JSON.stringify(schemaContent)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonString }} />;
}
