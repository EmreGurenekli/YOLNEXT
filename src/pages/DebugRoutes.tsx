import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className='mb-8'>
    <h2 className='text-lg font-semibold text-slate-900 mb-3'>{title}</h2>
    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2'>
      {children}
    </div>
  </div>
);

const Item: React.FC<{ to: string; label: string }> = ({ to, label }) => (
  <Link
    to={to}
    className='px-3 py-2 rounded border border-gray-200 hover:bg-gray-50 text-slate-700'
  >
    {label}
  </Link>
);

const DebugRoutes: React.FC = () => {
  return (
    <div className='min-h-screen bg-white'>
      <Helmet>
        <title>Debug Routes | QA</title>
      </Helmet>

      <div className='max-w-6xl mx-auto px-4 py-8'>
        <h1 className='text-2xl font-bold text-slate-900 mb-6'>
          Debug / Routes
        </h1>

        <Section title='Public'>
          <Item to='/' label='Landing' />
          <Item to='/login' label='Login' />
          <Item to='/register' label='Register' />
        </Section>

        <Section title='Individual'>
          <Item to='/individual/dashboard' label='Dashboard' />
          <Item to='/individual/create-shipment' label='Create Shipment' />
          <Item to='/individual/offers' label='Offers' />
          <Item to='/individual/agreements' label='Agreements' />
          <Item to='/individual/shipments' label='Shipments' />
          <Item to='/individual/my-shipments' label='My Shipments' />
          <Item to='/individual/history' label='History' />
          <Item to='/individual/live-tracking' label='Live Tracking' />
          <Item to='/individual/messages' label='Messages' />
          <Item to='/individual/notifications' label='Notifications' />
          <Item to='/individual/discounts' label='Discounts' />
          <Item to='/individual/help' label='Help' />
          <Item to='/individual/how-it-works' label='How It Works' />
          <Item to='/individual/profile' label='Profile' />
        </Section>

        <Section title='Corporate'>
          <Item to='/corporate/dashboard' label='Dashboard' />
          <Item to='/corporate/create-shipment' label='Create Shipment' />
          <Item to='/corporate/shipments' label='Shipments' />
          <Item to='/corporate/analytics' label='Analytics' />
          <Item to='/corporate/team' label='Team' />
          <Item to='/corporate/reports' label='Reports' />
          <Item to='/corporate/messages' label='Messages' />
          <Item to='/corporate/notifications' label='Notifications' />
          <Item to='/corporate/settings' label='Settings' />
          <Item to='/corporate/help' label='Help' />
          <Item to='/corporate/discounts' label='Discounts' />
          <Item to='/corporate/carriers' label='Carriers' />
          <Item to='/corporate/guide' label='Guide' />
          <Item
            to='/corporate/department-reporting'
            label='Department Reporting'
          />
          <Item to='/corporate/workflow' label='Workflow' />
          <Item to='/corporate/detailed-reports' label='Detailed Reports' />
          <Item to='/corporate/cost-analysis' label='Cost Analysis' />
        </Section>

        <Section title='Nakliyeci'>
          <Item to='/nakliyeci/dashboard' label='Dashboard' />
          <Item to='/nakliyeci/active-shipments' label='Active Shipments (Loads replaced)' />
          <Item to='/nakliyeci/offers' label='Offers' />
          <Item
            to='/nakliyeci/vehicle-optimization'
            label='Vehicle Optimization'
          />
          <Item to='/nakliyeci/shipments' label='Shipments' />
          <Item to='/nakliyeci/drivers' label='Drivers (Carriers replaced)' />
          <Item to='/nakliyeci/analytics' label='Analytics' />
          <Item to='/nakliyeci/messages' label='Messages' />
          <Item to='/nakliyeci/settings' label='Settings' />
          <Item to='/nakliyeci/help' label='Help' />
        </Section>

        <Section title='Taşıyıcı'>
          <Item to='/tasiyici/dashboard' label='Dashboard' />
          <Item to='/tasiyici/jobs' label='Jobs' />
          <Item to='/tasiyici/active-jobs' label='Active Jobs' />
          <Item to='/tasiyici/completed-jobs' label='Completed Jobs' />
          <Item to='/tasiyici/earnings' label='Earnings' />
          <Item to='/tasiyici/profile' label='Profile' />
          <Item to='/tasiyici/messages' label='Messages' />
          <Item to='/tasiyici/settings' label='Settings' />
          <Item to='/tasiyici/help' label='Help' />
        </Section>
      </div>
    </div>
  );
};

export default DebugRoutes;
