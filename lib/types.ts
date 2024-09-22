
export interface Chapter {
    id: string;
    title: string;
    description: string;
    startTime: number;
  }
  
  export interface FeatureProps {
    title: string;
    description: string;
    icon: React.ReactNode;
  }
  
  export interface TestimonialProps {
    quote: string;
    author: string;
    role: string;
  }
  
  export interface VideoInputChapter {
    title: string;
    startTime: number;
    endTime: number;
  }