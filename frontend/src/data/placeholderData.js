// Realistic Southport placeholder data for design review. Swap for the API
// (see src/api/client.js) once the backend is wired up.

export const businesses = [
    {
        slug: 'candymonium',
        name: 'Candymonium',
        category: 'Sweet shop',
        tier: 'founding',
        description: 'Pick-and-mix sweet shop on the high street, build-your-own bags and gifting boxes.',
        connections: 9,
    },
    {
        slug: 'watag-tattoo',
        name: 'WATAG Tattoo Studio',
        category: 'Tattoo studio',
        tier: 'founding',
        description: 'Custom tattoo studio, walk-ins and private bookings.',
        connections: 11,
    },
    {
        slug: 'digz-n-lidz',
        name: "Digz N' Lidz",
        category: 'RC experience cafe',
        tier: 'premium',
        description: 'Remote-control car track and cafe, race nights and birthday sessions.',
        connections: 7,
    },
    {
        slug: 'rubies-and-pearls',
        name: 'Rubies & Pearls',
        category: 'Antique jewellery',
        tier: 'free',
        description: 'Antique and vintage jewellery, valuations and restoration.',
        connections: 5,
    },
    {
        slug: 'joyces-irish-whiskey',
        name: "Joyce's Irish Whiskey",
        category: 'Drinks producer',
        tier: 'premium',
        description: 'Southport-founded Irish whiskey, stocked nationwide.',
        connections: 14,
    },
    {
        slug: 'the-victoria-hotel',
        name: 'The Victoria Hotel',
        category: 'Hotel & bar',
        tier: 'founding',
        description: 'Independent hotel and bar near the seafront, function room for hire.',
        connections: 14,
    },
    {
        slug: 'lord-street-roasters',
        name: 'Lord Street Coffee Roasters',
        category: 'Coffee roaster & cafe',
        tier: 'free',
        description: 'Small-batch roastery with a cafe counter on Lord Street.',
        connections: 6,
    },
    {
        slug: 'kew-bakehouse',
        name: 'The Kew Bakehouse',
        category: 'Bakery',
        tier: 'free',
        description: 'Sourdough and viennoiserie, wholesale to local cafes.',
        connections: 4,
    },
];

export const posts = [
    {
        id: 'p1',
        businessSlug: 'the-victoria-hotel',
        scope: 'local',
        type: 'offer',
        sponsored: false,
        content: 'Function room free for any Southport business booking a launch or network night this quarter.',
        createdAt: '2h ago',
    },
    {
        id: 'p2',
        businessSlug: 'joyces-irish-whiskey',
        scope: 'national',
        type: 'update',
        sponsored: false,
        content: 'Now stocked in 40 independent bottle shops across the UK, full list on our site.',
        createdAt: '5h ago',
    },
    {
        id: 'p3',
        businessSlug: 'watag-tattoo',
        scope: 'local',
        type: 'update',
        sponsored: false,
        content: 'Two walk-in slots open this Saturday, first come first served from 10am.',
        createdAt: '1d ago',
    },
    {
        id: 'p4',
        businessSlug: 'digz-n-lidz',
        scope: 'local',
        type: 'event',
        sponsored: true,
        content: 'Partner spotlight: Friday night race league is back, sign-ups through the app.',
        createdAt: '1d ago',
    },
    {
        id: 'p5',
        businessSlug: 'candymonium',
        scope: 'local',
        type: 'offer',
        sponsored: false,
        content: 'Refer a customer through PortSide this week, they get 10% off their first pick-and-mix bag.',
        createdAt: '2d ago',
    },
    {
        id: 'p6',
        businessSlug: 'lord-street-roasters',
        scope: 'international',
        type: 'update',
        sponsored: false,
        content: 'New single-origin from a farm in Huila, Colombia, on the counter from Monday.',
        createdAt: '3d ago',
    },
];

export const referrals = [
    { fromSlug: 'the-victoria-hotel', toSlug: 'candymonium', status: 'completed' },
    { fromSlug: 'watag-tattoo', toSlug: 'lord-street-roasters', status: 'active' },
    { fromSlug: 'digz-n-lidz', toSlug: 'kew-bakehouse', status: 'pending' },
    { fromSlug: 'candymonium', toSlug: 'the-victoria-hotel', status: 'completed' },
    { fromSlug: 'rubies-and-pearls', toSlug: 'joyces-irish-whiskey', status: 'active' },
];

export const leaderboard = [
    { rank: 1, slug: 'the-victoria-hotel', name: 'The Victoria Hotel', connections: 14, trend: 'up' },
    { rank: 2, slug: 'joyces-irish-whiskey', name: "Joyce's Irish Whiskey", connections: 14, trend: 'up' },
    { rank: 3, slug: 'watag-tattoo', name: 'WATAG Tattoo Studio', connections: 11, trend: 'up' },
    { rank: 4, slug: 'candymonium', name: 'Candymonium', connections: 9, trend: 'down' },
    { rank: 5, slug: 'digz-n-lidz', name: "Digz N' Lidz", connections: 7, trend: 'up' },
    { rank: 6, slug: 'lord-street-roasters', name: 'Lord Street Coffee Roasters', connections: 6, trend: 'down' },
];

export function getBusiness(slug) {
    return businesses.find((b) => b.slug === slug);
}
