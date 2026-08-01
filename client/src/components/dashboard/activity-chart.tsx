import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { motion } from 'framer-motion';

type ActivityData = {
  day: string;
  percentage: number;
  isCurrentDay?: boolean;
};

type ActivityChartProps = {
  data: ActivityData[];
  changePercentage: string;
  isPositiveChange: boolean;
  className?: string;
};

export default function ActivityChart({ data, changePercentage, isPositiveChange, className }: ActivityChartProps) {
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <Card className={cn("backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl", className)}>
      <CardHeader className="px-6 pt-6 pb-0">
        <div className="flex justify-between items-center mb-6">
          <CardTitle className="font-heading font-semibold bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Student Activity
          </CardTitle>
          <div className="flex space-x-2 bg-white/50 rounded-lg p-1 border border-white/20">
            {(['weekly', 'monthly', 'yearly'] as const).map((time) => (
              <Button 
                key={time}
                variant={timeframe === time ? "default" : "ghost"} 
                onClick={() => setTimeframe(time)}
                size="sm"
                className={cn(
                  "text-sm rounded-md transition-all duration-200",
                  timeframe === time 
                    ? "bg-accent-brand text-white shadow-lg" 
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                {time.charAt(0).toUpperCase() + time.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="h-64 flex items-end space-x-3 relative">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {[0, 25, 50, 75, 100].map((line) => (
              <div key={line} className="border-t border-gray-200/50" />
            ))}
          </div>
          
          {data.map((item, index) => (
            <div key={index} className="flex flex-col items-center flex-1 relative">
              <motion.div 
                className={cn(
                  "w-full rounded-t-xl relative overflow-hidden group cursor-pointer",
                  item.isCurrentDay 
                    ? "bg-accent-brand shadow-lg" 
                    : "bg-gradient-to-t from-gray-300 to-gray-400"
                )}
                style={{ height: `${item.percentage}%` }}
                initial={{ height: 0 }}
                animate={{ height: `${item.percentage}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                onHoverStart={() => setHoveredIndex(index)}
                onHoverEnd={() => setHoveredIndex(null)}
                whileHover={{ scale: 1.05 }}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
                
                {/* Hover tooltip */}
                {hoveredIndex === index && (
                  <motion.div 
                    className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {item.percentage}% activity
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-2 h-2 bg-gray-900 rotate-45" />
                  </motion.div>
                )}
              </motion.div>
              <p className={cn(
                "text-xs font-medium mt-3 transition-colors duration-200",
                item.isCurrentDay ? "text-blue-600 font-semibold" : "text-gray-500",
                hoveredIndex === index && "text-gray-900"
              )}>
                {item.day}
              </p>
            </div>
          ))}
        </div>
        
        <motion.div 
          className="mt-6 pt-4 border-t border-gray-200/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Current Week Engagement</p>
              <p className="text-gray-500 text-xs">vs. Previous Week</p>
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1 }}
            >
              <span className={cn(
                "font-bold text-sm px-3 py-1 rounded-full",
                isPositiveChange 
                  ? "bg-green-100 text-green-700" 
                  : "bg-red-100 text-red-700"
              )}>
                {isPositiveChange ? '↗' : '↘'} {changePercentage}
              </span>
            </motion.div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}