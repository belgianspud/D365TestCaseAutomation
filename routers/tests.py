"""
Test case management routes
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from database import get_db
from models import TestCase, TestRun, User
from schemas import (
    TestCase as TestCaseSchema,
    TestCaseCreate,
    TestCaseUpdate,
    TestRunCreate,
    TestRun as TestRunSchema,
    MessageResponse
)
from auth import get_current_user
from test_executor import test_executor

router = APIRouter()

@router.post("/", response_model=TestCaseSchema)
async def create_test_case(
    test_case: TestCaseCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new test case"""
    # Validate test steps
    validated_steps = test_executor.validate_test_steps(test_case.steps)
    if not validated_steps:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid test steps provided"
        )
    
    # Create test case
    db_test_case = TestCase(
        name=test_case.name,
        description=test_case.description,
        steps=validated_steps,
        expected_result=test_case.expected_result,
        tags=test_case.tags,
        owner_id=current_user["user_id"]
    )
    
    db.add(db_test_case)
    db.commit()
    db.refresh(db_test_case)
    
    return db_test_case

@router.get("/", response_model=List[TestCaseSchema])
async def list_test_cases(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    tags: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """List test cases for the current user"""
    query = db.query(TestCase).filter(
        TestCase.owner_id == current_user["user_id"],
        TestCase.is_active == True
    )
    
    # Apply search filter
    if search:
        query = query.filter(
            TestCase.name.contains(search) | 
            TestCase.description.contains(search)
        )
    
    # Apply tags filter
    if tags:
        query = query.filter(TestCase.tags.contains(tags))
    
    test_cases = query.offset(skip).limit(limit).all()
    return test_cases

@router.get("/{test_case_id}", response_model=TestCaseSchema)
async def get_test_case(
    test_case_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific test case"""
    test_case = db.query(TestCase).filter(
        TestCase.id == test_case_id,
        TestCase.owner_id == current_user["user_id"]
    ).first()
    
    if not test_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test case not found"
        )
    
    return test_case

@router.put("/{test_case_id}", response_model=TestCaseSchema)
async def update_test_case(
    test_case_id: int,
    test_case_update: TestCaseUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update a test case"""
    test_case = db.query(TestCase).filter(
        TestCase.id == test_case_id,
        TestCase.owner_id == current_user["user_id"]
    ).first()
    
    if not test_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test case not found"
        )
    
    # Update fields
    update_data = test_case_update.dict(exclude_unset=True)
    
    # Validate steps if provided
    if "steps" in update_data:
        validated_steps = test_executor.validate_test_steps(update_data["steps"])
        if not validated_steps:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid test steps provided"
            )
        update_data["steps"] = validated_steps
    
    for field, value in update_data.items():
        setattr(test_case, field, value)
    
    db.commit()
    db.refresh(test_case)
    
    return test_case

@router.delete("/{test_case_id}", response_model=MessageResponse)
async def delete_test_case(
    test_case_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete a test case (soft delete)"""
    test_case = db.query(TestCase).filter(
        TestCase.id == test_case_id,
        TestCase.owner_id == current_user["user_id"]
    ).first()
    
    if not test_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test case not found"
        )
    
    test_case.is_active = False
    db.commit()
    
    return {"message": "Test case deleted successfully"}

@router.post("/{test_case_id}/run", response_model=TestRunSchema)
async def run_test_case(
    test_case_id: int,
    run_request: TestRunCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Execute a test case"""
    test_case = db.query(TestCase).filter(
        TestCase.id == test_case_id,
        TestCase.owner_id == current_user["user_id"]
    ).first()
    
    if not test_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test case not found"
        )
    
    # Create test run record
    test_run = TestRun(
        test_case_id=test_case_id,
        user_id=current_user["user_id"],
        status="pending"
    )
    
    db.add(test_run)
    db.commit()
    db.refresh(test_run)
    
    # Execute test asynchronously
    try:
        test_run.status = "running"
        test_run.started_at = db.query(TestRun).filter(TestRun.id == test_run.id).first().created_at
        db.commit()
        
        # Prepare test case data
        test_case_data = {
            "name": test_case.name,
            "steps": test_case.steps
        }
        
        # Execute test
        result = await test_executor.execute_test(
            test_case_data,
            test_run.id,
            run_request.environment_url
        )
        
        # Update test run with results
        test_run.status = result.get("status", "error")
        test_run.execution_time = result.get("execution_time", 0)
        test_run.result = result.get("stdout", "")
        test_run.error_message = result.get("stderr") or result.get("error_message")
        test_run.screenshot_path = result.get("screenshot_path")
        test_run.trace_path = result.get("trace_path")
        test_run.completed_at = db.query(TestRun).filter(TestRun.id == test_run.id).first().created_at
        
        db.commit()
        db.refresh(test_run)
        
    except Exception as e:
        test_run.status = "error"
        test_run.error_message = str(e)
        db.commit()
        db.refresh(test_run)
    
    return test_run

@router.get("/{test_case_id}/runs", response_model=List[TestRunSchema])
async def get_test_case_runs(
    test_case_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get test runs for a specific test case"""
    # Verify test case ownership
    test_case = db.query(TestCase).filter(
        TestCase.id == test_case_id,
        TestCase.owner_id == current_user["user_id"]
    ).first()
    
    if not test_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test case not found"
        )
    
    test_runs = db.query(TestRun).filter(
        TestRun.test_case_id == test_case_id
    ).order_by(TestRun.created_at.desc()).offset(skip).limit(limit).all()
    
    return test_runs

@router.post("/example-test-case", response_model=TestCaseSchema)
async def create_example_test_case(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create an example test case demonstrating conditional actions and break criteria"""
    
    example_steps = [
        {
            "type": "navigate",
            "value": "https://your-d365-environment.dynamics.com",
            "description": "Navigate to D365 environment",
            "timeout": 30000
        },
        {
            "type": "wait",
            "value": "3000",
            "description": "Wait for page to load"
        },
        {
            "type": "condition",
            "condition_type": "exists",
            "condition_selector": "[data-id='signin-button']",
            "description": "Check if sign-in button exists"
        },
        {
            "type": "break_if",
            "condition_type": "not_exists",
            "condition_selector": "[data-id='main-grid']",
            "break_on_condition": False,
            "description": "Break with fail if main grid is not found after login",
            "timeout": 15000
        },
        {
            "type": "click",
            "selector": "[data-id='new-record-button']",
            "description": "Click new record button",
            "timeout": 10000
        },
        {
            "type": "loop_until",
            "condition_type": "not_visible",
            "condition_selector": "[data-id='form-loading-indicator']",
            "max_attempts": 10,
            "on_failure": "continue",
            "description": "Wait until form loading indicator disappears"
        },
        {
            "type": "fill",
            "selector": "[data-id='name-field']",
            "value": "Test Account Name",
            "description": "Fill account name field"
        },
        {
            "type": "fill",
            "selector": "[data-id='email-field']",
            "value": "test@example.com",
            "description": "Fill email field"
        },
        {
            "type": "condition",
            "condition_type": "text_contains",
            "condition_selector": "[data-id='validation-message']",
            "condition_value": "error",
            "description": "Check for validation errors"
        },
        {
            "type": "break_if",
            "condition_type": "visible",
            "condition_selector": "[data-id='error-dialog']",
            "break_on_condition": False,
            "description": "Break with fail if error dialog appears"
        },
        {
            "type": "click",
            "selector": "[data-id='save-button']",
            "description": "Save the record"
        },
        {
            "type": "loop_until",
            "condition_type": "text_contains",
            "condition_selector": "[data-id='status-message']",
            "condition_value": "saved",
            "max_attempts": 15,
            "on_failure": "break_fail",
            "description": "Wait for successful save confirmation"
        },
        {
            "type": "verify",
            "selector": "[data-id='record-id']",
            "expected": "visible",
            "description": "Verify record ID is visible"
        },
        {
            "type": "break_if",
            "condition_type": "text_equals",
            "condition_selector": "[data-id='form-mode']",
            "condition_value": "readonly",
            "break_on_condition": True,
            "description": "Break with pass if form is in readonly mode (record saved successfully)"
        }
    ]
    
    example_test_case = TestCase(
        name="D365 Account Creation with Conditional Logic",
        description="Example test case demonstrating Playwright automation with conditional actions, break criteria, and loop conditions for D365 account creation",
        steps=example_steps,
        expected_result="pass",
        tags="example,d365,conditional,playwright,account-creation",
        owner_id=current_user["user_id"]
    )
    
    db.add(example_test_case)
    db.commit()
    db.refresh(example_test_case)
    
    return example_test_case
