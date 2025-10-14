import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'avatarClass',
  standalone: true
})
export class AvatarClassPipe implements PipeTransform {
  // Shades of primary color #3D62A8 - from lighter to darker
  private colors = [
    '#5A7FBF', // Lighter blue
    '#4A6FB5', // Light-medium blue
    '#3D62A8', // Primary blue
    '#36579A', // Medium-dark blue
    '#2F4D8C', // Dark blue
    '#28437E', // Darker blue
    '#658AC5', // Lighter variant
    '#4E69AC', // Medium variant
  ];

  transform(assignee?: string): string {
    if (!assignee) return '#94A3B8'; // Neutral gray for unassigned
    
    // Generate consistent color based on name
    const hash = assignee.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorHex = this.colors[hash % this.colors.length];
    
    // Return inline style instead of Tailwind class for custom colors
    return colorHex;
  }
}

@Pipe({
  name: 'initials',
  standalone: true
})
export class InitialsPipe implements PipeTransform {
  transform(name?: string): string {
    if (!name) return '?';
    return name.trim().split(/\s+/)
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
}