import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'avatarClass',
  standalone: true
})
export class AvatarClassPipe implements PipeTransform {
  private colors = [
    'bg-blue-600', 'bg-green-600', 'bg-purple-600', 'bg-orange-600', 
    'bg-pink-600', 'bg-red-600', 'bg-indigo-600', 'bg-teal-600'
  ];

  transform(assignee?: string): string {
    if (!assignee) return 'bg-gray-400';
    
    // Generate consistent color based on name
    const hash = assignee.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return this.colors[hash % this.colors.length];
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
