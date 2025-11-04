import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { BacklogPage } from './backlog-page';
import { ModalService } from '../../modal/modal-service';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import { Issue } from '../../shared/models/issue.model';
import { Epic } from '../../shared/models/epic.model';
import { FilterCriteria } from '../../shared/filters/filters';

describe('BacklogPage', () => {
	let fixture: ComponentFixture<BacklogPage>;
	let component: BacklogPage;
	let modalServiceMock: jasmine.SpyObj<ModalService>;
	let sidebarStateServiceMock: any;``

	beforeEach(async () => {
		modalServiceMock = jasmine.createSpyObj('ModalService', ['open']);
		sidebarStateServiceMock = {
			// The real service exposes `isCollapsed` as a signal (callable). Tests and templates
			// call `isCollapsed()` so provide a spy function to avoid TypeError.
			isCollapsed: jasmine.createSpy('isCollapsed').and.returnValue(false),
			toggleCollapse: jasmine.createSpy('toggleCollapse')
		};

		await TestBed.configureTestingModule({
			imports: [BacklogPage, RouterTestingModule],
			providers: [
				{ provide: ModalService, useValue: modalServiceMock },
				{ provide: SidebarStateService, useValue: sidebarStateServiceMock }
			],
			schemas: [NO_ERRORS_SCHEMA]
		}).compileComponents();

		fixture = TestBed.createComponent(BacklogPage);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('sprint getters', () => {
		it('should return arrays for active, planned and completed sprints', () => {
			expect(Array.isArray(component.activeSprints)).toBeTrue();
			expect(Array.isArray(component.plannedSprints)).toBeTrue();
			expect(Array.isArray(component.completedSprints)).toBeTrue();
		});
	});

	describe('modal interactions', () => {
		it('handleCreateSprint should open create sprint modal', () => {
			component.handleCreateSprint();
			expect(modalServiceMock.open).toHaveBeenCalled();
			const callArg = modalServiceMock.open.calls.mostRecent().args[0];
			expect(callArg.id).toBe('sprintModal');
			expect(callArg.title).toContain('Create Sprint');
			expect(Array.isArray(callArg.fields)).toBeTrue();
		});

		it('handleEdit should open edit modal when sprint exists', () => {
			const sprint = component.sprints[0];
			modalServiceMock.open.calls.reset();
			component.handleEdit(sprint.id);
			expect(modalServiceMock.open).toHaveBeenCalled();
			const callArg = modalServiceMock.open.calls.mostRecent().args[0];
			expect(callArg.id).toBe('shareModal');
			expect(callArg.title).toContain('Edit Sprint');
			expect(callArg.data.sprintName).toBeDefined();
		});

		it('handleEdit should not open modal and log error when sprint not found', () => {
			modalServiceMock.open.calls.reset();
			spyOn(console, 'error');
			component.handleEdit('non-existent-id');
			expect(modalServiceMock.open).not.toHaveBeenCalled();
			expect(console.error).toHaveBeenCalled();
		});
	});

	describe('move issue behavior', () => {
		it('should move an issue from backlog to a sprint', () => {
			const backlogIssue: Issue | undefined = component.backlogIssues[0];
			const targetSprint = component.sprints.find(s => s.id && s.status !== 'COMPLETED') || component.sprints[0];
			expect(backlogIssue).toBeDefined();
			const originalBacklogLength = component.backlogIssues.length;
			const originalTargetIssues = (targetSprint.issues || []).length;

			component.handleMoveIssue(backlogIssue!.id, targetSprint.id);

			expect(component.backlogIssues.length).toBe(originalBacklogLength - 1);
			const updatedSprint = component.sprints.find(s => s.id === targetSprint.id)!;
			expect((updatedSprint.issues || []).length).toBe(originalTargetIssues + 1);
			const moved = (updatedSprint.issues || []).find(i => i.id === backlogIssue!.id);
			expect(moved).toBeDefined();
			expect(moved!.sprintId).toBe(targetSprint.id);
		});

		it('should move an issue from a sprint to backlog', () => {
			let issueInSprint: Issue | undefined;
			let sourceSprintId: string | undefined;
			for (const s of component.sprints) {
				if (s.issues && s.issues.length > 0) {
					issueInSprint = s.issues[0];
					sourceSprintId = s.id;
					break;
				}
			}
			if (!issueInSprint) {
				const issue = component.backlogIssues[0];
				sourceSprintId = component.sprints[0].id;
				component.handleMoveIssue(issue.id, sourceSprintId);
				issueInSprint = component.sprints[0].issues![0];
			}

			const originalBacklogLen = component.backlogIssues.length;
			component.handleMoveIssue(issueInSprint!.id, null);
			expect(component.backlogIssues.length).toBe(originalBacklogLen + 1);
			const sourceSprint = component.sprints.find(s => s.id === sourceSprintId)!;
			const stillThere = sourceSprint.issues?.find(i => i.id === issueInSprint!.id);
			expect(stillThere).toBeUndefined();
		});

		it('handleMoveIssue should log error if issue not found', () => {
			spyOn(console, 'error');
			component.handleMoveIssue('does-not-exist', null);
			expect(console.error).toHaveBeenCalled();
		});
	});

	describe('sidebar and epic panel behavior', () => {
		it('onToggleSidebar should call sidebarStateService.toggleCollapse', () => {
			component.onToggleSidebar();
			expect(sidebarStateServiceMock.toggleCollapse).toHaveBeenCalled();
		});

	it('closeEpicPanel should close epic panel', () => {
		component.isEpicPanelOpen = true;
		component.closeEpicPanel();
		expect(component.isEpicPanelOpen).toBeFalse();
	});

	it('onFiltersChanged should set selectedEpicFilter', () => {
		const filterCriteria: FilterCriteria = {
			searchText: '',
			quickFilter: null,
			type: null,
			priority: null,
			status: null,
			assignees: [],
			sort: 'recent',
			view: 'sprints',
			epicId: 'epic-1',
			showCompletedSprints: false,
			showEpicPanel: false
		};
		component.onFiltersChanged(filterCriteria);
		expect(component.selectedEpicFilter).toBe('epic-1');
	});		it('epicFilterOptions should include All epics option and epics list', () => {
			const opts = component.epicFilterOptions;
			expect(opts.length).toBeGreaterThanOrEqual(component.epics.length + 1);
			expect(opts[0].id).toBeNull();
		});
	});

	describe('epic detail view methods', () => {
		it('openEpicDetailView should set selectedEpic as a copy', () => {
			const epic = component.epics[0];
			component.openEpicDetailView(epic.id);
			expect(component.selectedEpic).toBeTruthy();
			expect(component.selectedEpic!.id).toBe(epic.id);
			expect(component.selectedEpic).not.toBe(epic);
		});

		it('onEpicCreated should add epic and open it', () => {
			const newEpic: Epic = { id: 'new-epic', name: 'New Epic', description: 'd' } as Epic;
			const originalLen = component.epics.length;
			component.onEpicCreated(newEpic);
			expect(component.epics.length).toBe(originalLen + 1);
			expect(component.selectedEpic!.id).toBe(newEpic.id);
		});

		it('onEpicUpdated should update epic and selectedEpic', () => {
			const existing = component.epics[0];
			const updated: Epic = { ...existing, name: 'Updated Name' } as Epic;
			component.onEpicUpdated(updated);
			const found = component.epics.find(e => e.id === updated.id);
			expect(found!.name).toBe('Updated Name');
			expect(component.selectedEpic!.name).toBe('Updated Name');
		});

		it('closeEpicDetailView should clear selectedEpic', () => {
			component.selectedEpic = { id: 'x', name: 'y' } as Epic;
			component.closeEpicDetailView();
			expect(component.selectedEpic).toBeNull();
		});
	});

	describe('resize behavior', () => {
		it('startResize should set resizing state and capture start positions', () => {
			const ev: any = { clientX: 123, preventDefault: () => {} };
			component.epicDetailPanelWidth = 600;
			component.startResize(ev as MouseEvent);
			expect((component as any).isResizing).toBeTrue();
			expect((component as any).startX).toBe(123);
			expect((component as any).startWidth).toBe(600);
		});

		it('onMouseMove should change width while resizing within bounds', () => {
			const evStart: any = { clientX: 100, preventDefault: () => {} };
			component.epicDetailPanelWidth = 600;
			component.startResize(evStart as MouseEvent);

			const moveEv: any = { clientX: 80 };
			(component as any).onMouseMove(moveEv as MouseEvent);
			expect(component.epicDetailPanelWidth).toBe(620);
		});

		it('onMouseMove should ignore width changes outside bounds', () => {
			const evStart: any = { clientX: 1000, preventDefault: () => {} };
			component.epicDetailPanelWidth = 400;
			component.startResize(evStart as MouseEvent);

			const moveEv: any = { clientX: 2000 };
			(component as any).onMouseMove(moveEv as MouseEvent);
			expect(component.epicDetailPanelWidth).toBe(400);
		});

		it('onMouseUp should stop resizing', () => {
			const evStart: any = { clientX: 50, preventDefault: () => {} };
			component.startResize(evStart as MouseEvent);
			(component as any).onMouseUp();
			expect((component as any).isResizing).toBeFalse();
		});
	});
});
