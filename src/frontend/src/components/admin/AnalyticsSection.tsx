import { Download as DownloadIcon, Eye, Smartphone, FileDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGetVisitCount, useGetDownloadCount, useGetAllVisits, useGetAllDownloads } from '../../hooks/useQueries';
import { toast } from 'sonner';

export default function AnalyticsSection() {
  const { data: visitCount = BigInt(0), isLoading: isLoadingVisits } = useGetVisitCount();
  const { data: downloadCount = BigInt(0), isLoading: isLoadingDownloads } = useGetDownloadCount();
  const { data: allVisits = [], isLoading: isLoadingAllVisits } = useGetAllVisits();
  const { data: allDownloads = [], isLoading: isLoadingAllDownloads } = useGetAllDownloads();

  const handleExportToExcel = () => {
    try {
      // Create CSV content for visits
      const visitsHeaders = ['Visit ID', 'Page', 'Browser', 'Device', 'Location', 'Session ID', 'Timestamp'];
      const visitsRows = allVisits.map((visit) => [
        Number(visit.id),
        visit.page,
        visit.browser,
        visit.device,
        visit.location,
        visit.sessionId,
        new Date(Number(visit.timestamp) / 1000000).toLocaleString(),
      ]);

      // Create CSV content for downloads
      const downloadsHeaders = ['Download ID', 'Browser', 'Device', 'Platform', 'Version', 'Location', 'Session ID', 'Timestamp'];
      const downloadsRows = allDownloads.map((download) => [
        Number(download.id),
        download.browser,
        download.device,
        download.platform,
        download.version,
        download.location,
        download.sessionId,
        new Date(Number(download.timestamp) / 1000000).toLocaleString(),
      ]);

      // Create summary
      const summaryHeaders = ['Metric', 'Count'];
      const summaryRows = [
        ['Total Visits', Number(visitCount)],
        ['Total PWA Installs', Number(downloadCount)],
        ['Export Date', new Date().toLocaleString()],
      ];

      // Convert to CSV format
      const csvToString = (headers: string[], rows: (string | number)[][]) => {
        const escapeCsv = (value: string | number) => {
          const str = String(value);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        };
        
        const headerRow = headers.map(escapeCsv).join(',');
        const dataRows = rows.map(row => row.map(escapeCsv).join(',')).join('\n');
        return `${headerRow}\n${dataRows}`;
      };

      // Combine all sheets into one CSV with separators
      const csvContent = [
        '=== SUMMARY ===',
        csvToString(summaryHeaders, summaryRows),
        '',
        '=== VISITS ===',
        csvToString(visitsHeaders, visitsRows),
        '',
        '=== PWA INSTALLS ===',
        csvToString(downloadsHeaders, downloadsRows),
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const filename = `aurelie-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Analytics exported successfully!', {
        description: `File saved as ${filename}`,
        className: 'border-gold/50 bg-gradient-to-r from-dark-maroon/90 to-gold/20',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export analytics', {
        description: 'Please try again later',
      });
    }
  };

  const isLoading = isLoadingVisits || isLoadingDownloads;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gold">Analytics <span className="text-gold shimmer">Dashboard</span></h2>
          <p className="text-gold/70">Track user visits and PWA installations</p>
        </div>
        <Button 
          onClick={handleExportToExcel}
          disabled={isLoadingAllVisits || isLoadingAllDownloads}
          className="bg-gold hover:bg-gold/90 text-dark-maroon font-semibold shadow-gold-glow"
        >
          <FileDown className="mr-2 h-4 w-4" />
          Export to CSV
        </Button>
      </div>

      {/* Stats Cards with Dual-Tone Theme */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-gold/20 bg-gradient-to-br from-pink-100/40 to-dark-maroon/30 hover:shadow-gold-glow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium text-gold">Total User Visits</CardTitle>
              <CardDescription className="text-gold/60">Real-time visit tracking</CardDescription>
            </div>
            <Eye className="h-8 w-8 text-gold" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-10 bg-muted rounded animate-pulse" />
            ) : (
              <div className="text-4xl font-bold text-gold shimmer">
                {Number(visitCount).toLocaleString()}
              </div>
            )}
            <p className="text-xs text-gold/60 mt-2">
              Unique page visits recorded
            </p>
          </CardContent>
        </Card>

        <Card className="border-gold/20 bg-gradient-to-br from-dark-maroon/30 to-pink-100/40 hover:shadow-gold-glow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium text-gold">PWA Installations</CardTitle>
              <CardDescription className="text-gold/60">App download tracking</CardDescription>
            </div>
            <Smartphone className="h-8 w-8 text-gold" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-10 bg-muted rounded animate-pulse" />
            ) : (
              <div className="text-4xl font-bold text-gold shimmer">
                {Number(downloadCount).toLocaleString()}
              </div>
            )}
            <p className="text-xs text-gold/60 mt-2">
              Progressive Web App installs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity with Dual-Tone Theme */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Visits */}
        <Card className="border-gold/20 bg-gradient-to-br from-pink-100/30 to-dark-maroon/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gold">
              <Eye className="h-5 w-5 text-gold" />
              Recent Visits
            </CardTitle>
            <CardDescription className="text-gold/60">Latest user page visits</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingAllVisits ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : allVisits.length === 0 ? (
              <p className="text-sm text-gold/70 text-center py-8">
                No visits recorded yet
              </p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {allVisits.slice(-10).reverse().map((visit) => (
                  <div 
                    key={Number(visit.id)} 
                    className="flex items-start justify-between p-3 rounded-lg border border-gold/10 bg-gradient-to-r from-pink-100/20 to-dark-maroon/20 hover:from-pink-100/30 hover:to-dark-maroon/30 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gold">{visit.page}</p>
                      <p className="text-xs text-gold/60">
                        {visit.device} • {visit.browser}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gold/60">
                        {new Date(Number(visit.timestamp) / 1000000).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gold/60">
                        {new Date(Number(visit.timestamp) / 1000000).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Downloads */}
        <Card className="border-gold/20 bg-gradient-to-br from-dark-maroon/20 to-pink-100/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gold">
              <DownloadIcon className="h-5 w-5 text-gold" />
              Recent PWA Installs
            </CardTitle>
            <CardDescription className="text-gold/60">Latest app installations</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingAllDownloads ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : allDownloads.length === 0 ? (
              <p className="text-sm text-gold/70 text-center py-8">
                No PWA installs recorded yet
              </p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {allDownloads.slice(-10).reverse().map((download) => (
                  <div 
                    key={Number(download.id)} 
                    className="flex items-start justify-between p-3 rounded-lg border border-gold/10 bg-gradient-to-r from-dark-maroon/20 to-pink-100/20 hover:from-dark-maroon/30 hover:to-pink-100/30 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gold">{download.platform}</p>
                      <p className="text-xs text-gold/60">
                        {download.device} • {download.browser}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gold/60">
                        {new Date(Number(download.timestamp) / 1000000).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gold/60">
                        {new Date(Number(download.timestamp) / 1000000).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
