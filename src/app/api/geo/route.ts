import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // 1. Check Vercel Edge Headers
    const vercelLat = req.headers.get('x-vercel-ip-latitude');
    const vercelLng = req.headers.get('x-vercel-ip-longitude');
    const vercelCity = req.headers.get('x-vercel-ip-city');
    const vercelCountry = req.headers.get('x-vercel-ip-country');
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '';

    if (vercelLat && vercelLng) {
      return NextResponse.json({
        ip: clientIp || 'Vercel Edge Client',
        city: vercelCity ? decodeURIComponent(vercelCity) : 'Edge Location',
        country: vercelCountry || 'Global',
        lat: parseFloat(vercelLat),
        lng: parseFloat(vercelLng),
        source: 'vercel_edge_header',
      });
    }

    // 2. Fetch IP Geolocation from reliable external provider
    const targetUrl = clientIp && clientIp !== '127.0.0.1' && clientIp !== '::1'
      ? `https://ipwho.is/${clientIp}`
      : 'https://ipwho.is/';

    const geoRes = await fetch(targetUrl, {
      headers: { 'User-Agent': 'AnytimeView-GeoService/1.0' },
      cache: 'no-store',
    });

    if (geoRes.ok) {
      const data = await geoRes.json();
      if (data && data.success !== false && data.latitude && data.longitude) {
        return NextResponse.json({
          ip: data.ip,
          city: data.city || data.region || 'Detected City',
          region: data.region,
          country: data.country || 'Detected Region',
          lat: data.latitude,
          lng: data.longitude,
          source: 'ip_geo_service',
        });
      }
    }

    // Fallback: Default to India location
    return NextResponse.json({
      ip: clientIp || '152.58.168.245',
      city: 'Kolkata',
      country: 'India',
      lat: 22.5726,
      lng: 88.3639,
      source: 'fallback',
    });
  } catch (err: any) {
    return NextResponse.json({
      ip: 'Detected Node',
      city: 'Kolkata',
      country: 'India',
      lat: 22.5726,
      lng: 88.3639,
      source: 'exception_fallback',
    });
  }
}
